"""
SQLite database persistence manager for WhatsApp messages, contacts, and workflow states.
Uses aiosqlite for asynchronous database operations.
"""

import json
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
import aiosqlite

from config import settings
from whatsapp.models import ChatMessageRecord, ContactInfo, MessageType

logger = logging.getLogger("DealFlow.WhatsApp.DB")


class WhatsAppDatabase:
    """
    Asynchronous SQLite Database manager for WhatsApp service.
    """

    def __init__(self, db_path: Path = settings.DB_PATH):
        self.db_path = db_path

    async def initialize(self) -> None:
        """
        Create necessary SQLite tables if they do not exist.
        """
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS whatsapp_messages (
                    id TEXT PRIMARY KEY,
                    instance TEXT NOT NULL,
                    chat_jid TEXT NOT NULL,
                    sender_jid TEXT NOT NULL,
                    sender_name TEXT,
                    message_type TEXT NOT NULL,
                    content TEXT NOT NULL,
                    from_me INTEGER NOT NULL,
                    status TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    metadata JSON
                );
            """)

            await db.execute("""
                CREATE TABLE IF NOT EXISTS whatsapp_contacts (
                    jid TEXT PRIMARY KEY,
                    name TEXT,
                    phone TEXT NOT NULL,
                    push_name TEXT,
                    profile_pic_url TEXT,
                    updated_at TEXT NOT NULL
                );
            """)

            await db.execute("""
                CREATE TABLE IF NOT EXISTS whatsapp_sessions (
                    chat_jid TEXT PRIMARY KEY,
                    state TEXT NOT NULL,
                    step TEXT NOT NULL,
                    data JSON,
                    updated_at TEXT NOT NULL
                );
            """)

            await db.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    service TEXT NOT NULL,
                    action TEXT NOT NULL,
                    details JSON,
                    timestamp TEXT NOT NULL
                );
            """)

            await db.commit()
            logger.info(f"WhatsApp SQLite database initialized at {self.db_path}")

    async def save_message(self, record: ChatMessageRecord) -> bool:
        """
        Insert or update a chat message record.
        """
        try:
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    INSERT OR REPLACE INTO whatsapp_messages 
                    (id, instance, chat_jid, sender_jid, sender_name, message_type, content, from_me, status, timestamp, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    record.id,
                    record.instance,
                    record.chat_jid,
                    record.sender_jid,
                    record.sender_name,
                    record.message_type.value,
                    record.content,
                    1 if record.from_me else 0,
                    record.status,
                    record.timestamp,
                    json.dumps(record.metadata or {})
                ))
                await db.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to save WhatsApp message {record.id}: {e}")
            return False

    async def get_chat_history(self, chat_jid: str, limit: int = 50) -> List[ChatMessageRecord]:
        """
        Retrieve recent chat history for a specific JID.
        """
        try:
            async with aiosqlite.connect(self.db_path) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute("""
                    SELECT * FROM whatsapp_messages 
                    WHERE chat_jid = ? 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                """, (chat_jid, limit)) as cursor:
                    rows = await cursor.fetchall()
                    history = []
                    for row in reversed(rows):
                        history.append(ChatMessageRecord(
                            id=row["id"],
                            instance=row["instance"],
                            chat_jid=row["chat_jid"],
                            sender_jid=row["sender_jid"],
                            sender_name=row["sender_name"],
                            message_type=MessageType(row["message_type"]),
                            content=row["content"],
                            from_me=bool(row["from_me"]),
                            status=row["status"],
                            timestamp=row["timestamp"],
                            metadata=json.loads(row["metadata"] or "{}")
                        ))
                    return history
        except Exception as e:
            logger.error(f"Failed to fetch chat history for {chat_jid}: {e}")
            return []

    async def save_contact(self, contact: ContactInfo) -> bool:
        """
        Save or update contact details.
        """
        try:
            import time
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    INSERT OR REPLACE INTO whatsapp_contacts
                    (jid, name, phone, push_name, profile_pic_url, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    contact.id,
                    contact.name,
                    contact.phone,
                    contact.push_name,
                    contact.profile_pic_url,
                    now_iso
                ))
                await db.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to save contact {contact.id}: {e}")
            return False

    async def set_workflow_state(self, chat_jid: str, state: str, step: str, data: Dict[str, Any]) -> bool:
        """
        Set active workflow state for an interactive user session.
        """
        try:
            import time
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    INSERT OR REPLACE INTO whatsapp_sessions
                    (chat_jid, state, step, data, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (chat_jid, state, step, json.dumps(data or {}), now_iso))
                await db.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to set workflow state for {chat_jid}: {e}")
            return False

    async def get_workflow_state(self, chat_jid: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve active workflow state for a chat session.
        """
        try:
            async with aiosqlite.connect(self.db_path) as db:
                db.row_factory = aiosqlite.Row
                async with db.execute("SELECT * FROM whatsapp_sessions WHERE chat_jid = ?", (chat_jid,)) as cursor:
                    row = await cursor.fetchone()
                    if row:
                        return {
                            "chat_jid": row["chat_jid"],
                            "state": row["state"],
                            "step": row["step"],
                            "data": json.loads(row["data"] or "{}"),
                            "updated_at": row["updated_at"]
                        }
                    return None
        except Exception as e:
            logger.error(f"Failed to get workflow state for {chat_jid}: {e}")
            return None

    async def log_audit_event(self, service: str, action: str, details: Dict[str, Any]) -> bool:
        """
        Log compliance or operation audit entry.
        """
        try:
            import time
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            async with aiosqlite.connect(self.db_path) as db:
                await db.execute("""
                    INSERT INTO audit_logs (service, action, details, timestamp)
                    VALUES (?, ?, ?, ?)
                """, (service, action, json.dumps(details or {}), now_iso))
                await db.commit()
                return True
        except Exception as e:
            logger.error(f"Audit log write failed: {e}")
            return False


# Global DB Singleton instance
db_manager = WhatsAppDatabase()
