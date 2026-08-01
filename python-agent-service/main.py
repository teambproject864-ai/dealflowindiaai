#!/usr/bin/env python3
"""
DealFlow AI Python Agent Service.
Provides REST and WebSocket APIs for Evolution API WhatsApp Integration
and the Rewritten Live Call Bot (WebRTC / SIP).
"""

import asyncio
import logging
import os
import time
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs):
        pass

from fastapi import FastAPI, HTTPException, Request, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from config import settings
from whatsapp import (
    whatsapp_client,
    ws_listener,
    workflow_engine,
    db_manager,
    SendTextMessageRequest,
    SendMediaMessageRequest,
    SendLocationMessageRequest,
    ConnectionState
)
from call_bot import call_session_manager

# --- Logging Setup ---
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(name)s] [%(levelname)s] %(message)s"
)
logger = logging.getLogger("DealFlow.Main")


# --- Lifespan Context Manager ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Service startup and shutdown lifecycle event handler.
    """
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}...")
    
    # Initialize SQLite Database tables
    await db_manager.initialize()
    
    # Start background WebSocket listener for Evolution API
    try:
        await ws_listener.start()
    except Exception as e:
        logger.warning(f"Could not start Evolution API WebSocket listener on startup: {e}")


    yield

    logger.info("Shutting down service...")
    await ws_listener.stop()
    await whatsapp_client.close()


# --- Initialize FastAPI App ---
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Unified Evolution API WhatsApp Integration & Real-time Live Call Bot Service for DealFlow AI",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request Schemas ---
class CallStartRequest(BaseModel):
    call_type: str = Field(default="discovery", description="Call type: discovery, onboarding, standup, weekly, escalation")
    meeting_url: Optional[str] = Field(default=None, description="Optional meeting URL")
    sdp_offer: Optional[str] = Field(default=None, description="Optional WebRTC SDP offer string")
    intake_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Customer intake metadata")


class InboundAudioFrameRequest(BaseModel):
    session_id: str = Field(..., description="Active session ID")
    pcm_base64: str = Field(..., description="Base64 encoded 16kHz 16-bit PCM audio frame bytes")


# --- Routes ---

@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint reporting service uptime, version, and database state.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "evolution_api_url": settings.EVOLUTION_API_URL,
        "whatsapp_websocket": "active" if ws_listener.is_running else "inactive",
        "active_call_sessions": len(call_session_manager.active_sessions)
    }


# --- WhatsApp Evolution API Endpoints ---

@app.post("/whatsapp/instance/create", tags=["WhatsApp"])
async def create_whatsapp_instance(instance_name: Optional[str] = None):
    """
    Creates a new Evolution API WhatsApp instance.
    """
    status_obj = await whatsapp_client.create_instance(instance_name)
    return {"success": True, "instance": status_obj.model_dump()}


@app.get("/whatsapp/instance/status", tags=["WhatsApp"])
async def get_whatsapp_instance_status(instance_name: Optional[str] = None):
    """
    Fetches the status of the WhatsApp instance.
    """
    status_obj = await whatsapp_client.fetch_instance_status(instance_name)
    return {"success": True, "instance": status_obj.model_dump()}


@app.get("/whatsapp/instance/qrcode", tags=["WhatsApp"])
async def get_whatsapp_qrcode(instance_name: Optional[str] = None):
    """
    Fetches QR code for WhatsApp web scanning.
    """
    code = await whatsapp_client.fetch_qrcode(instance_name)
    if not code:
        raise HTTPException(status_code=404, detail="QR code not available or instance already connected.")
    return {"success": True, "qrcode": code}


@app.post("/whatsapp/send/text", tags=["WhatsApp"])
async def send_whatsapp_text(req: SendTextMessageRequest):
    """
    Sends a text message over WhatsApp with rate limiting and recipient cooldown.
    """
    try:
        record = await whatsapp_client.send_text_message(req)
        return {"success": True, "message": record.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/whatsapp/send/media", tags=["WhatsApp"])
async def send_whatsapp_media(req: SendMediaMessageRequest):
    """
    Sends a media message (image, video, document, audio) over WhatsApp.
    """
    try:
        record = await whatsapp_client.send_media_message(req)
        return {"success": True, "message": record.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/whatsapp/send/location", tags=["WhatsApp"])
async def send_whatsapp_location(req: SendLocationMessageRequest):
    """
    Sends a location message over WhatsApp.
    """
    try:
        record = await whatsapp_client.send_location_message(req)
        return {"success": True, "message": record.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/whatsapp/contacts", tags=["WhatsApp"])
async def get_whatsapp_contacts():
    """
    Fetches all WhatsApp contacts.
    """
    contacts = await whatsapp_client.fetch_contacts()
    return {"success": True, "count": len(contacts), "contacts": [c.model_dump() for c in contacts]}


@app.post("/whatsapp/webhook", tags=["WhatsApp"])
async def evolution_webhook_listener(request: Request):
    """
    Inbound Webhook listener for Evolution API event webhooks.
    """
    try:
        payload = await request.json()
        logger.info(f"Received Evolution API Webhook: {payload.get('event')}")
        await ws_listener._dispatch_event(payload)
        return {"success": True, "status": "processed"}
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        return JSONResponse(content={"success": False, "error": str(e)}, status_code=400)


# --- Dealflow Live Call Bot Endpoints ---

@app.post("/callbot/start", tags=["Call Bot"])
async def start_call_session(req: CallStartRequest):
    """
    Initiates a new real-time WebRTC / SIP call bot session.
    """
    session = await call_session_manager.create_session(
        call_type=req.call_type,
        meeting_url=req.meeting_url,
        intake_context=req.intake_context
    )
    res = await session.start(sdp_offer=req.sdp_offer)
    return {"success": True, "session": res}


@app.post("/callbot/stop/{session_id}", tags=["Call Bot"])
async def stop_call_session(session_id: str):
    """
    Stops a live call bot session, finalizes recording, extracts CallSummary JSON, and syncs to CRM.
    """
    res = await call_session_manager.end_session(session_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Call session {session_id} not found.")
    return {"success": True, "result": res}


@app.get("/callbot/status/{session_id}", tags=["Call Bot"])
async def get_call_session_status(session_id: str):
    """
    Fetches status, transcript history, and recording info for a call session.
    """
    session = call_session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Call session {session_id} not found.")
    
    return {
        "success": True,
        "session_id": session_id,
        "is_active": session.is_running,
        "is_bot_speaking": session.is_bot_speaking,
        "is_user_speaking": session.webrtc_session.is_user_speaking,
        "transcript_count": len(session.conversation_history),
        "transcripts": session.conversation_history
    }


@app.post("/callbot/audio/inbound", tags=["Call Bot"])
async def push_inbound_audio_frame(req: InboundAudioFrameRequest):
    """
    Receives raw base64 encoded audio bytes for an active call session.
    """
    session = call_session_manager.get_session(req.session_id)
    if not session or not session.is_running:
        raise HTTPException(status_code=404, detail=f"Active session {req.session_id} not found.")
    
    import base64
    try:
        pcm_bytes = base64.b64decode(req.pcm_base64)
        frame = await session.webrtc_session.push_inbound_audio_frame(pcm_bytes)
        return {
            "success": True,
            "session_id": req.session_id,
            "user_speaking": session.webrtc_session.is_user_speaking,
            "energy": round(frame.calculate_energy(), 2)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid PCM audio payload: {e}")


# --- Entrypoint ---
if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting uvicorn server on {settings.HOST}:{settings.PORT}...")
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
