"""
Unit tests for Evolution API WhatsApp Integration.
Tests REST client, rate limiter, SQLite persistence, and workflow engine.
"""

import asyncio
import pytest
from pathlib import Path
import tempfile

from whatsapp.models import (
    SendTextMessageRequest,
    SendMediaMessageRequest,
    ContactInfo,
    ChatMessageRecord,
    MessageType
)
from whatsapp.rate_limiter import TokenBucketRateLimiter, RecipientCooldownTracker
from whatsapp.database import WhatsAppDatabase
from whatsapp.client import EvolutionAPIClient
from whatsapp.workflow import WhatsAppWorkflowEngine


@pytest.mark.asyncio
async def test_token_bucket_rate_limiter():
    """
    Test Token Bucket Rate Limiter acquires tokens cleanly.
    """
    limiter = TokenBucketRateLimiter(rate=50.0, capacity=10.0)
    start_time = asyncio.get_event_loop().time()
    
    for _ in range(5):
        await limiter.acquire(1.0)
        
    elapsed = asyncio.get_event_loop().time() - start_time
    assert elapsed < 1.0, f"Rate limiter took too long ({elapsed}s)"


@pytest.mark.asyncio
async def test_recipient_cooldown_tracker():
    """
    Test per-recipient cooldown tracker enforces minimum delay.
    """
    cooldown = RecipientCooldownTracker(cooldown_seconds=0.1)
    start_time = asyncio.get_event_loop().time()
    
    await cooldown.wait_cooldown("15550199999")
    await cooldown.wait_cooldown("15550199999")
    
    elapsed = asyncio.get_event_loop().time() - start_time
    assert elapsed >= 0.08, f"Cooldown failed to enforce delay ({elapsed}s)"


@pytest.mark.asyncio
async def test_whatsapp_sqlite_database():
    """
    Test SQLite database CRUD operations for messages, contacts, and workflow states.
    """
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = Path(tmp.name)

    try:
        db = WhatsAppDatabase(db_path=db_path)
        await db.initialize()

        # 1. Save and fetch message
        msg_record = ChatMessageRecord(
            id="test-msg-101",
            instance="test-instance",
            chat_jid="15550199999@s.whatsapp.net",
            sender_jid="15550199999@s.whatsapp.net",
            sender_name="John Prospect",
            message_type=MessageType.TEXT,
            content="Hello DealFlow!",
            from_me=False,
            status="received",
            timestamp="2026-07-25T10:00:00Z"
        )
        assert await db.save_message(msg_record) is True

        history = await db.get_chat_history("15550199999@s.whatsapp.net")
        assert len(history) == 1
        assert history[0].id == "test-msg-101"
        assert history[0].content == "Hello DealFlow!"

        # 2. Save and fetch contact
        contact = ContactInfo(
            id="15550199999@s.whatsapp.net",
            name="John Prospect",
            phone="15550199999",
            push_name="John P"
        )
        assert await db.save_contact(contact) is True

        # 3. Save and fetch workflow state
        assert await db.set_workflow_state("15550199999@s.whatsapp.net", "lead_intake", "step_1", {"company": "Acme SaaS"}) is True
        state = await db.get_workflow_state("15550199999@s.whatsapp.net")
        assert state is not None
        assert state["state"] == "lead_intake"
        assert state["data"]["company"] == "Acme SaaS"

    finally:
        if db_path.exists():
            db_path.unlink()


@pytest.mark.asyncio
async def test_evolution_api_client_formatting():
    """
    Test Evolution API client phone number and JID formatting.
    """
    client = EvolutionAPIClient(base_url="http://localhost:8080", api_key="dummy", instance_name="test")
    
    assert client.format_phone_number("+1 (555) 019-9999") == "15550199999"
    assert client.format_jid("+1 555 019 9999") == "15550199999@s.whatsapp.net"
    assert client.format_jid("15550199999@s.whatsapp.net") == "15550199999@s.whatsapp.net"
