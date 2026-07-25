"""
Pydantic data models for WhatsApp Evolution API integration.
Includes models for requests, responses, webhook events, and internal state objects.
"""

from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class MessageType(str, Enum):
    TEXT = "text"
    MEDIA = "media"
    AUDIO = "audio"
    DOCUMENT = "document"
    LOCATION = "location"
    BUTTONS = "buttons"


class ConnectionState(str, Enum):
    DISCONNECTED = "close"
    CONNECTING = "connecting"
    CONNECTED = "open"
    QRCODE = "qrcode"


class SendTextMessageRequest(BaseModel):
    number: str = Field(..., description="Phone number with country code, e.g. 15550199999")
    text: str = Field(..., description="Text content to send")
    delay_ms: int = Field(default=1000, description="Artificial typing delay in milliseconds")


class SendMediaMessageRequest(BaseModel):
    number: str = Field(..., description="Target recipient phone number")
    media_url: str = Field(..., description="Public HTTP URL of media file")
    media_type: str = Field(default="image", description="Media type: image, video, audio, document")
    caption: Optional[str] = Field(default=None, description="Optional caption text")
    filename: Optional[str] = Field(default=None, description="Filename for documents")


class SendLocationMessageRequest(BaseModel):
    number: str = Field(..., description="Target recipient phone number")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    title: Optional[str] = Field(default=None, description="Location title")
    address: Optional[str] = Field(default=None, description="Address text")


class ContactInfo(BaseModel):
    id: str = Field(..., description="JID of contact, e.g. 15550199999@s.whatsapp.net")
    name: Optional[str] = Field(default=None, description="Contact display name")
    phone: str = Field(..., description="Phone number")
    push_name: Optional[str] = Field(default=None, description="WhatsApp pushName")
    profile_pic_url: Optional[str] = Field(default=None, description="Profile picture URL")


class InstanceStatus(BaseModel):
    instance_name: str = Field(..., description="Evolution API instance name")
    state: ConnectionState = Field(..., description="Current connection state")
    qrcode: Optional[str] = Field(default=None, description="Base64 QR code or pairing code if waiting to scan")
    owner_jid: Optional[str] = Field(default=None, description="JID of connected phone")


class InboundWebhookEvent(BaseModel):
    event: str = Field(..., description="Event name, e.g. messages.upsert, connection.update")
    instance: str = Field(..., description="Instance identifier")
    data: Dict[str, Any] = Field(default_factory=dict, description="Event data body")


class ChatMessageRecord(BaseModel):
    id: str = Field(..., description="Message ID")
    instance: str = Field(..., description="Evolution API instance name")
    chat_jid: str = Field(..., description="Chat JID")
    sender_jid: str = Field(..., description="Sender JID")
    sender_name: Optional[str] = Field(default=None, description="Sender name")
    message_type: MessageType = Field(default=MessageType.TEXT, description="Type of message")
    content: str = Field(..., description="Message text or caption content")
    from_me: bool = Field(default=False, description="True if sent by us, False if received")
    status: str = Field(default="received", description="Status: sent, delivered, read, received")
    timestamp: str = Field(..., description="ISO 8601 timestamp string")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
