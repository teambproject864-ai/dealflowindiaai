"""
Real-time WebSocket event listener for Evolution API.
Connects to Evolution API socket endpoints to receive real-time message upserts,
connection updates, and QR code events with automatic reconnection logic.
"""

import asyncio
import json
import logging
import time
from typing import Optional, Callable, Dict, Any, List
import websockets

from config import settings
from whatsapp.models import ChatMessageRecord, MessageType, ConnectionState
from whatsapp.database import db_manager

logger = logging.getLogger("DealFlow.WhatsApp.WebSocket")


class EvolutionWebSocketListener:
    """
    Async WebSocket Client listening to Evolution API event stream.
    """

    def __init__(
        self,
        ws_url: str = settings.EVOLUTION_WEBSOCKET_URL,
        api_key: str = settings.EVOLUTION_API_KEY,
        instance_name: str = settings.EVOLUTION_INSTANCE_NAME
    ):
        self.ws_url = ws_url
        self.api_key = api_key
        self.instance_name = instance_name
        self.is_running = False
        self._task: Optional[asyncio.Task] = None
        self._event_handlers: List[Callable[[Dict[str, Any]], None]] = []

    def register_handler(self, handler: Callable[[Dict[str, Any]], None]) -> None:
        """
        Register a callback function to handle incoming WebSocket event dictionaries.
        """
        self._event_handlers.append(handler)

    async def start(self) -> None:
        """
        Starts the background WebSocket listener task.
        """
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._listen_loop())
        logger.info(f"Started Evolution WebSocket listener for instance '{self.instance_name}'")

    async def stop(self) -> None:
        """
        Stops the background WebSocket listener.
        """
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info(f"Stopped Evolution WebSocket listener for instance '{self.instance_name}'")

    async def _listen_loop(self) -> None:
        """
        Main loop managing WebSocket connection and automatic reconnection with backoff.
        """
        backoff = 1.0
        while self.is_running:
            try:
                # Append apikey token if not present in URL
                connect_url = f"{self.ws_url}/{self.instance_name}?apikey={self.api_key}" if "?" not in self.ws_url else self.ws_url
                logger.info(f"Connecting to Evolution WebSocket: {self.ws_url}...")

                async with websockets.connect(connect_url, ping_interval=30, ping_timeout=10) as ws:
                    logger.info("Successfully connected to Evolution WebSocket stream.")
                    backoff = 1.0  # Reset backoff on clean connection

                    while self.is_running:
                        message_str = await ws.recv()
                        if not message_str:
                            continue

                        try:
                            payload = json.loads(message_str)
                            await self._dispatch_event(payload)
                        except json.JSONDecodeError:
                            logger.warn(f"Failed to parse WebSocket JSON payload: {message_str[:100]}")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warn(f"Evolution WebSocket connection error: {e}. Reconnecting in {backoff:.1f}s...")
                await asyncio.sleep(backoff)
                backoff = min(30.0, backoff * 1.5)

    async def _dispatch_event(self, payload: Dict[str, Any]) -> None:
        """
        Parses WebSocket event payload and dispatches to registered handlers and workflow triggers.
        """
        event_name = payload.get("event") or payload.get("type")
        event_data = payload.get("data") or payload.get("body") or {}
        instance = payload.get("instance") or self.instance_name

        logger.debug(f"Received WS Event '{event_name}' for instance '{instance}'")

        # 1. Handle incoming message events (messages.upsert)
        if event_name in ("messages.upsert", "messages-upsert", "MESSAGES_UPSERT"):
            await self._handle_messages_upsert(event_data, instance)

        # 2. Handle connection state updates (connection.update)
        elif event_name in ("connection.update", "connection-update"):
            state = event_data.get("state") or event_data.get("status")
            logger.info(f"Evolution Instance '{instance}' connection state update: {state}")

        # 3. Handle QR Code update events
        elif event_name in ("qrcode.updated", "qrcode-updated"):
            logger.info(f"Evolution Instance '{instance}' QR code refreshed.")

        # Dispatch payload to all registered external handlers
        for handler in self._event_handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(payload)
                else:
                    handler(payload)
            except Exception as handler_err:
                logger.error(f"Error in WebSocket event handler callback: {handler_err}")

    async def _handle_messages_upsert(self, data: Dict[str, Any], instance: str) -> None:
        """
        Parses inbound message upsert data, stores it in SQLite DB, and triggers automated workflow routing.
        """
        key = data.get("key") or {}
        message_body = data.get("message") or {}
        from_me = key.get("fromMe", False)
        msg_id = key.get("id") or f"inbound-{int(time.time()*1000)}"
        remote_jid = key.get("remoteJid") or ""

        if not remote_jid or remote_jid.endswith("@g.us"):
            # Skip group messages or invalid JIDs by default for clean lead pipeline
            return

        # Extract text or caption content
        text_content = (
            message_body.get("conversation") or
            message_body.get("extendedTextMessage", {}).get("text") or
            message_body.get("imageMessage", {}).get("caption") or
            message_body.get("videoMessage", {}).get("caption") or
            ""
        ).strip()

        msg_type = MessageType.TEXT
        if "imageMessage" in message_body or "videoMessage" in message_body or "documentMessage" in message_body:
            msg_type = MessageType.MEDIA
        elif "audioMessage" in message_body:
            msg_type = MessageType.AUDIO
        elif "locationMessage" in message_body:
            msg_type = MessageType.LOCATION

        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        push_name = data.get("pushName") or "WhatsApp Lead"

        record = ChatMessageRecord(
            id=msg_id,
            instance=instance,
            chat_jid=remote_jid,
            sender_jid=key.get("participant") or remote_jid,
            sender_name=push_name,
            message_type=msg_type,
            content=text_content,
            from_me=from_me,
            status="received",
            timestamp=now_iso,
            metadata={"raw_event": data}
        )

        # Save to SQLite database
        await db_manager.save_message(record)

        # If message is from an external user, trigger inbound workflow routing
        if not from_me and text_content:
            from whatsapp.workflow import workflow_engine
            asyncio.create_task(workflow_engine.process_inbound_message(record))


# Global WebSocket Singleton instance
ws_listener = EvolutionWebSocketListener()
