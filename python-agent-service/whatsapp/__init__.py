"""
WhatsApp Evolution API Module for DealFlow AI Python Agent Service.
"""

from whatsapp.models import (
    MessageType,
    ConnectionState,
    SendTextMessageRequest,
    SendMediaMessageRequest,
    SendLocationMessageRequest,
    ContactInfo,
    InstanceStatus,
    ChatMessageRecord
)
from whatsapp.rate_limiter import TokenBucketRateLimiter, RecipientCooldownTracker
from whatsapp.database import WhatsAppDatabase, db_manager
from whatsapp.client import EvolutionAPIClient, whatsapp_client
from whatsapp.websocket import EvolutionWebSocketListener, ws_listener
from whatsapp.workflow import WhatsAppWorkflowEngine, workflow_engine

__all__ = [
    "MessageType",
    "ConnectionState",
    "SendTextMessageRequest",
    "SendMediaMessageRequest",
    "SendLocationMessageRequest",
    "ContactInfo",
    "InstanceStatus",
    "ChatMessageRecord",
    "TokenBucketRateLimiter",
    "RecipientCooldownTracker",
    "WhatsAppDatabase",
    "db_manager",
    "EvolutionAPIClient",
    "whatsapp_client",
    "EvolutionWebSocketListener",
    "ws_listener",
    "WhatsAppWorkflowEngine",
    "workflow_engine"
]
