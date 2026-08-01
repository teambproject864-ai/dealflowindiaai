"""
Inbound message routing, keyword triggers, stateful lead qualification workflow engine,
and automated response handler for WhatsApp integration.
"""

import asyncio
import logging
import re
from typing import Dict, Any, Optional
import httpx

from config import settings
from whatsapp.models import ChatMessageRecord, SendTextMessageRequest
from whatsapp.client import whatsapp_client
from whatsapp.database import db_manager

logger = logging.getLogger("DealFlow.WhatsApp.Workflow")


class WhatsAppWorkflowEngine:
    """
    Automated workflow router and stateful conversation manager for WhatsApp messages.
    """

    def __init__(self):
        self.cal_demo_url = "https://calendly.com/dealflow-demo/30min"

    async def process_inbound_message(self, message: ChatMessageRecord) -> None:
        """
        Main entry point for processing an inbound message received from a lead/customer.
        """
        chat_jid = message.chat_jid
        text = message.content.strip().lower()
        sender_name = message.sender_name or "there"

        logger.info(f"Processing inbound WhatsApp message from {chat_jid} ({sender_name}): '{text}'")

        # Helper to send workflow response safely
        async def _safe_send(reply_str: str):
            try:
                await whatsapp_client.send_text_message(SendTextMessageRequest(number=chat_jid, text=reply_str))
            except Exception as send_err:
                logger.warning(f"Could not send WhatsApp workflow reply to {chat_jid} (Evolution API offline/mock): {send_err}")


        # 1. Check for active multi-turn workflow session state in SQLite DB
        session = await db_manager.get_workflow_state(chat_jid)

        if session and session.get("state") == "lead_intake":
            await self._continue_lead_intake_workflow(chat_jid, text, session)
            return

        # 2. Keyword & Intent Pattern Matching for New Conversations
        if re.search(r"\b(hello|hi|hey|start|help|info)\b", text):
            reply_text = (
                f"👋 Hello {sender_name}! Welcome to *DealFlow AI*.\n\n"
                "We provide AI-powered revenue intelligence and autonomous GTM pipeline automation for B2B teams.\n\n"
                "How can I assist you today?\n"
                "1️⃣ *Demo* - Schedule a 1-on-1 strategy call\n"
                "2️⃣ *Pricing* - View plans & enterprise options\n"
                "3️⃣ *Lead Intake* - Start instant qualification\n"
                "4️⃣ *Support* - Speak with a human specialist\n\n"
                "_Reply with a number or keyword (e.g., 'Demo' or 'Pricing')._"
            )
            await _safe_send(reply_text)

        elif re.search(r"\b(1|demo|book|schedule|call|meeting)\b", text):
            reply_text = (
                "📅 *Schedule Your DealFlow AI Demo*\n\n"
                f"You can instantly pick a convenient 15-minute slot on our calendar here:\n{self.cal_demo_url}\n\n"
                "Or would you like to answer 3 quick questions right here on WhatsApp to customize your demo briefing?"
            )
            await _safe_send(reply_text)
            await db_manager.set_workflow_state(chat_jid, "lead_intake", "await_company", {"step": 1})

        elif re.search(r"\b(2|price|pricing|cost|plans|tier)\b", text):
            reply_text = (
                "💰 *DealFlow AI Pricing Tiers*\n\n"
                "• *Starter*: $499/mo - Up to 5,000 lead intakes & automated CRM sync.\n"
                "• *Growth*: $1,299/mo - Full Autonomous Agent Brain, Multi-channel (SMS, Email, WhatsApp) & 3D Analytics.\n"
                "• *Enterprise*: Custom - Dedicated fine-tuned Dealflow LLM model, FAPO prompt optimization & 99.5% Uptime SLA.\n\n"
                "Would you like to start a free trial or schedule a demo? Reply *Demo* to proceed."
            )
            await _safe_send(reply_text)

        elif re.search(r"\b(3|intake|qualify|qualification)\b", text):
            reply_text = (
                "🚀 *Instant Lead Qualification*\n\n"
                "Let's get your GTM profile configured! What is your company name?"
            )
            await _safe_send(reply_text)
            await db_manager.set_workflow_state(chat_jid, "lead_intake", "await_company", {"step": 1})

        elif re.search(r"\b(4|support|human|representative|agent)\b", text):
            reply_text = (
                "👨‍💼 *Connecting to Human Representative*\n\n"
                "Our team has been notified of your request! An executive account manager will respond directly in this chat shortly."
            )
            await _safe_send(reply_text)
            await db_manager.log_audit_event("whatsapp_workflow", "human_escalation", {"chat_jid": chat_jid, "name": sender_name})

        else:
            # Fallback default AI guidance reply
            reply_text = (
                f"Thank you for contacting DealFlow AI, {sender_name}!\n\n"
                "Reply *Demo* to book a demo call, *Pricing* to view packages, or *Intake* to submit your company profile for an instant analysis."
            )
            await _safe_send(reply_text)

    async def _continue_lead_intake_workflow(self, chat_jid: str, text: str, session: Dict[str, Any]) -> None:
        """
        Handles step-by-step multi-turn lead intake flow.
        """
        step = session.get("step")
        data = session.get("data", {})

        if step == "await_company":
            data["company_name"] = text.title()
            reply_text = f"Got it, *{data['company_name']}*! What is your team size or approximate monthly lead volume?"
            await whatsapp_client.send_text_message(SendTextMessageRequest(number=chat_jid, text=reply_text))
            await db_manager.set_workflow_state(chat_jid, "lead_intake", "await_team_size", data)

        elif step == "await_team_size":
            data["team_size"] = text
            reply_text = "Great! Finally, what is your primary business email address?"
            await whatsapp_client.send_text_message(SendTextMessageRequest(number=chat_jid, text=reply_text))
            await db_manager.set_workflow_state(chat_jid, "lead_intake", "await_email", data)

        elif step == "await_email":
            # Extract email via regex
            email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
            data["email"] = email_match.group(0) if email_match else text

            reply_text = (
                f"🎉 *Qualification Complete for {data.get('company_name')}!*\n\n"
                f"• Company: {data.get('company_name')}\n"
                f"• Size/Volume: {data.get('team_size')}\n"
                f"• Email: {data.get('email')}\n\n"
                f"Your profile has been prioritized. You can lock in your VIP demo slot here:\n{self.cal_demo_url}"
            )
            await whatsapp_client.send_text_message(SendTextMessageRequest(number=chat_jid, text=reply_text))

            # Push collected lead metadata to DealFlow CRM API
            await self._sync_lead_to_crm(chat_jid, data)

            # Clear session state
            await db_manager.set_workflow_state(chat_jid, "completed", "done", {})

    async def _sync_lead_to_crm(self, chat_jid: str, lead_data: Dict[str, Any]) -> bool:
        """
        Pushes collected lead metadata to DealFlow CRM store / API.
        """
        if not settings.CRM_SYNC_ENABLED:
            return True

        phone = whatsapp_client.format_phone_number(chat_jid)
        payload = {
            "type": "customer",
            "record": {
                "customerName": f"WhatsApp Lead ({lead_data.get('company_name', 'Unknown')})",
                "email": lead_data.get("email", f"whatsapp_{phone}@dealflow.ai"),
                "phone": f"+{phone}",
                "companyName": lead_data.get("company_name", "WhatsApp Prospect"),
                "title": "Decision Maker"
            }
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(settings.CRM_API_BASE_URL, json=payload)
                if res.is_success:
                    logger.info(f"Successfully synced WhatsApp lead {phone} to DealFlow CRM.")
                    await db_manager.log_audit_event("whatsapp_crm_sync", "lead_synced", {"phone": phone, "lead": lead_data})
                    return True
                else:
                    logger.warning(f"CRM sync API returned status {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Could not reach DealFlow CRM API at {settings.CRM_API_BASE_URL}: {e}")


        return False


# Global Workflow Engine Singleton instance
workflow_engine = WhatsAppWorkflowEngine()
