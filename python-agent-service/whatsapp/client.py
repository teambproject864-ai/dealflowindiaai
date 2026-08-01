"""
Native async Python REST Client for Evolution API (WhatsApp Integration).
Supports instance authentication, QR code fetching, sending text/media/location/button messages,
contact management, and automatic retry policies with exponential backoff.
"""

import asyncio
import logging
import time
from typing import Optional, Dict, Any, List
import httpx

from config import settings
from whatsapp.models import (
    InstanceStatus,
    ConnectionState,
    ContactInfo,
    SendTextMessageRequest,
    SendMediaMessageRequest,
    SendLocationMessageRequest,
    ChatMessageRecord,
    MessageType
)
from whatsapp.rate_limiter import TokenBucketRateLimiter, RecipientCooldownTracker
from whatsapp.database import db_manager

logger = logging.getLogger("DealFlow.WhatsApp.Client")


class EvolutionAPIException(Exception):
    """Custom exception raised for Evolution API errors."""
    def __init__(self, message: str, status_code: Optional[int] = None, response_body: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body


class EvolutionAPIClient:
    """
    Async REST Client for Evolution API.
    """

    def __init__(
        self,
        base_url: str = settings.EVOLUTION_API_URL,
        api_key: str = settings.EVOLUTION_API_KEY,
        instance_name: str = settings.EVOLUTION_INSTANCE_NAME,
        max_retries: int = 3
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.instance_name = instance_name
        self.max_retries = max_retries
        self.rate_limiter = TokenBucketRateLimiter(rate=settings.MAX_MESSAGES_PER_SECOND, capacity=15.0)
        self.cooldown_tracker = RecipientCooldownTracker(cooldown_seconds=settings.RECIPIENT_COOLDOWN_SECONDS)
        self._http_client: Optional[httpx.AsyncClient] = None

    def _get_headers(self) -> Dict[str, str]:
        return {
            "apikey": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    async def _get_client(self) -> httpx.AsyncClient:
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=self._get_headers(),
                timeout=httpx.Timeout(30.0, connect=10.0)
            )
        return self._http_client

    async def close(self) -> None:
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()

    def format_phone_number(self, phone: str) -> str:
        """
        Formats raw phone number string into clean digits.
        """
        digits = "".join(c for c in phone if c.isdigit())
        return digits

    def format_jid(self, phone: str) -> str:
        """
        Formats phone number string into WhatsApp JID.
        """
        digits = self.format_phone_number(phone)
        if digits.endswith("@s.whatsapp.net"):
            return digits
        return f"{digits}@s.whatsapp.net"

    async def _request_with_retry(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        Executes HTTP request with rate limiting and exponential backoff retry policy.
        """
        await self.rate_limiter.acquire(1.0)
        client = await self._get_client()

        last_err = None
        for attempt in range(1, self.max_retries + 1):
            try:
                response = await client.request(method, endpoint, **kwargs)
                if response.is_success:
                    if response.status_code == 204 or not response.content:
                        return {"success": True}
                    return response.json()
                
                # Handle non-success response
                text = response.text
                logger.warning(f"Evolution API {method} {endpoint} returned {response.status_code} (attempt {attempt}): {text}")
                
                if response.status_code in (401, 403):
                    raise EvolutionAPIException(
                        f"Authentication failed: {response.status_code}", status_code=response.status_code, response_body=text
                    )

                if attempt == self.max_retries:
                    raise EvolutionAPIException(
                        f"Evolution API request failed after {self.max_retries} attempts: {response.status_code} {response.reason_phrase}",
                        status_code=response.status_code,
                        response_body=text
                    )

            except (httpx.RequestError, EvolutionAPIException) as err:
                last_err = err
                if isinstance(err, EvolutionAPIException) and err.status_code in (401, 403):
                    raise err

                backoff = min(8.0, 0.5 * (2 ** (attempt - 1)))
                logger.warning(f"Retryable error on {method} {endpoint} (attempt {attempt}/{self.max_retries}): {err}. Backoff {backoff}s...")
                await asyncio.sleep(backoff)


        raise last_err or EvolutionAPIException("Request failed after max retries")

    # --- Instance Management ---

    async def create_instance(self, instance_name: Optional[str] = None) -> InstanceStatus:
        """
        Creates a new WhatsApp instance on Evolution API.
        """
        inst = instance_name or self.instance_name
        payload = {
            "instanceName": inst,
            "token": self.api_key,
            "qrcode": True,
            "integration": "WHATSAPP-BAILEYS"
        }
        try:
            data = await self._request_with_retry("POST", "/instance/create", json=payload)
            instance_data = data.get("instance", data)
            qrcode = data.get("qrcode", {}).get("base64") if isinstance(data.get("qrcode"), dict) else None
            state_str = instance_data.get("state", "connecting")
            
            return InstanceStatus(
                instance_name=inst,
                state=ConnectionState.CONNECTED if state_str == "open" else ConnectionState.CONNECTING,
                qrcode=qrcode
            )
        except Exception as e:
            logger.error(f"Failed to create instance {inst}: {e}")
            return InstanceStatus(instance_name=inst, state=ConnectionState.DISCONNECTED)

    async def fetch_instance_status(self, instance_name: Optional[str] = None) -> InstanceStatus:
        """
        Fetches connection status of an instance.
        """
        inst = instance_name or self.instance_name
        try:
            data = await self._request_with_retry("GET", f"/instance/connectionState/{inst}")
            instance_state = data.get("instance", {}).get("state", "close")
            state_enum = ConnectionState.CONNECTED if instance_state == "open" else ConnectionState.DISCONNECTED
            
            return InstanceStatus(
                instance_name=inst,
                state=state_enum,
                owner_jid=data.get("instance", {}).get("ownerJid")
            )
        except Exception as e:
            logger.warning(f"Failed to fetch status for instance {inst}: {e}")
            return InstanceStatus(instance_name=inst, state=ConnectionState.DISCONNECTED)

    async def fetch_qrcode(self, instance_name: Optional[str] = None) -> Optional[str]:
        """
        Fetches current QR code for scanning.
        """
        inst = instance_name or self.instance_name
        try:
            data = await self._request_with_retry("GET", f"/instance/connect/{inst}")
            return data.get("base64") or data.get("code")
        except Exception as e:
            logger.warning(f"Failed to fetch QR code for instance {inst}: {e}")
            return None


    async def logout_instance(self, instance_name: Optional[str] = None) -> bool:
        """
        Logs out and disconnects instance session.
        """
        inst = instance_name or self.instance_name
        try:
            await self._request_with_retry("DELETE", f"/instance/logout/{inst}")
            return True
        except Exception as e:
            logger.error(f"Failed to logout instance {inst}: {e}")
            return False

    # --- Messaging Endpoints ---

    async def send_text_message(self, req: SendTextMessageRequest, instance_name: Optional[str] = None) -> ChatMessageRecord:
        """
        Sends text message to phone number with rate limiting and per-recipient cooldown.
        """
        inst = instance_name or self.instance_name
        phone_clean = self.format_phone_number(req.number)
        await self.cooldown_tracker.wait_cooldown(phone_clean)

        payload = {
            "number": phone_clean,
            "options": {
                "delay": req.delay_ms,
                "presence": "composing"
            },
            "textMessage": {
                "text": req.text
            }
        }

        try:
            res_data = await self._request_with_retry("POST", f"/message/sendText/{inst}", json=payload)
            msg_id = res_data.get("key", {}).get("id") or f"msg-{int(time.time()*1000)}"
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

            record = ChatMessageRecord(
                id=msg_id,
                instance=inst,
                chat_jid=self.format_jid(phone_clean),
                sender_jid=f"{inst}@system",
                sender_name="DealFlow Assistant",
                message_type=MessageType.TEXT,
                content=req.text,
                from_me=True,
                status="sent",
                timestamp=now_iso,
                metadata={"response_raw": res_data}
            )

            # Persist to local database asynchronously
            await db_manager.save_message(record)
            await db_manager.log_audit_event("whatsapp", "send_text", {"id": msg_id, "recipient": phone_clean})

            return record
        except Exception as e:
            logger.error(f"Error sending text message to {phone_clean}: {e}")
            raise

    async def send_media_message(self, req: SendMediaMessageRequest, instance_name: Optional[str] = None) -> ChatMessageRecord:
        """
        Sends media message (image, video, document, audio) via public URL.
        """
        inst = instance_name or self.instance_name
        phone_clean = self.format_phone_number(req.number)
        await self.cooldown_tracker.wait_cooldown(phone_clean)

        payload = {
            "number": phone_clean,
            "mediaMessage": {
                "mediatype": req.media_type,
                "caption": req.caption or "",
                "media": req.media_url,
                "fileName": req.filename or "file"
            }
        }

        res_data = await self._request_with_retry("POST", f"/message/sendMedia/{inst}", json=payload)
        msg_id = res_data.get("key", {}).get("id") or f"media-{int(time.time()*1000)}"
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        record = ChatMessageRecord(
            id=msg_id,
            instance=inst,
            chat_jid=self.format_jid(phone_clean),
            sender_jid=f"{inst}@system",
            sender_name="DealFlow Assistant",
            message_type=MessageType.MEDIA,
            content=req.caption or req.media_url,
            from_me=True,
            status="sent",
            timestamp=now_iso,
            metadata={"media_url": req.media_url, "media_type": req.media_type}
        )

        await db_manager.save_message(record)
        return record

    async def send_location_message(self, req: SendLocationMessageRequest, instance_name: Optional[str] = None) -> ChatMessageRecord:
        """
        Sends GPS location message.
        """
        inst = instance_name or self.instance_name
        phone_clean = self.format_phone_number(req.number)
        await self.cooldown_tracker.wait_cooldown(phone_clean)

        payload = {
            "number": phone_clean,
            "locationMessage": {
                "degreesLatitude": req.latitude,
                "degreesLongitude": req.longitude,
                "name": req.title or "Location",
                "address": req.address or ""
            }
        }

        res_data = await self._request_with_retry("POST", f"/message/sendLocation/{inst}", json=payload)
        msg_id = res_data.get("key", {}).get("id") or f"loc-{int(time.time()*1000)}"
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        record = ChatMessageRecord(
            id=msg_id,
            instance=inst,
            chat_jid=self.format_jid(phone_clean),
            sender_jid=f"{inst}@system",
            sender_name="DealFlow Assistant",
            message_type=MessageType.LOCATION,
            content=f"Location: {req.latitude},{req.longitude} ({req.title or ''})",
            from_me=True,
            status="sent",
            timestamp=now_iso,
            metadata={"latitude": req.latitude, "longitude": req.longitude}
        )

        await db_manager.save_message(record)
        return record

    # --- Contact Management ---

    async def fetch_contacts(self, instance_name: Optional[str] = None) -> List[ContactInfo]:
        """
        Fetches all contacts associated with the WhatsApp instance.
        """
        inst = instance_name or self.instance_name
        try:
            data = await self._request_with_retry("POST", f"/chat/findContacts/{inst}", json={})
            contacts = []
            if isinstance(data, list):
                for item in data:
                    jid = item.get("id") or item.get("jid") or ""
                    if jid:
                        contact = ContactInfo(
                            id=jid,
                            name=item.get("name") or item.get("pushName"),
                            phone=self.format_phone_number(jid),
                            push_name=item.get("pushName"),
                            profile_pic_url=item.get("profilePictureUrl")
                        )
                        contacts.append(contact)
                        await db_manager.save_contact(contact)
            return contacts
        except Exception as e:
            logger.error(f"Failed to fetch contacts for instance {inst}: {e}")
            return []

    async def fetch_profile_info(self, phone_or_jid: str, instance_name: Optional[str] = None) -> Optional[ContactInfo]:
        """
        Fetches profile info & profile picture URL for a specific phone number or JID.
        """
        inst = instance_name or self.instance_name
        phone_clean = self.format_phone_number(phone_or_jid)
        try:
            data = await self._request_with_retry("POST", f"/chat/fetchProfile/{inst}", json={"number": phone_clean})
            jid = self.format_jid(phone_clean)
            contact = ContactInfo(
                id=jid,
                name=data.get("name") or data.get("pushName"),
                phone=phone_clean,
                push_name=data.get("pushName"),
                profile_pic_url=data.get("picture")
            )
            await db_manager.save_contact(contact)
            return contact
        except Exception as e:
            logger.warning(f"Could not fetch profile info for {phone_clean}: {e}")
            return None



# Global API Client Singleton instance
whatsapp_client = EvolutionAPIClient()
