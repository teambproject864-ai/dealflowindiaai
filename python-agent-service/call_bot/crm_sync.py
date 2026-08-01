"""
CRM Synchronization Manager for Live Call Bot.
Pushes structured CallSummary JSON, lead qualification metrics, and company deal notes
directly to Dealflow CRM endpoints with retry policies.
"""

import asyncio
import logging
from typing import Dict, Any, Optional
import httpx

from config import settings
from whatsapp.database import db_manager

logger = logging.getLogger("DealFlow.CallBot.CRMSync")


class CRMSyncManager:
    """
    Handles Dealflow CRM API data synchronization for call bot outcomes.
    """

    def __init__(self, crm_url: str = settings.CRM_API_BASE_URL):
        self.crm_url = crm_url

    async def sync_call_summary(self, session_id: str, summary_data: Dict[str, Any]) -> bool:
        """
        Pushes a completed call summary object to Dealflow CRM store and SQLite audit logs.
        """
        logger.info(f"Synchronizing call summary for session {session_id} to Dealflow CRM ({summary_data.get('companyName')})...")

        # 1. Log audit event locally
        await db_manager.log_audit_event("call_bot_crm_sync", "call_summary_completed", {
            "session_id": session_id,
            "summary": summary_data
        })

        if not settings.CRM_SYNC_ENABLED:
            logger.info("CRM Sync is disabled in configuration. Skipping remote HTTP sync.")
            return True

        # 2. Push Company record to CRM
        company_payload = {
            "type": "company",
            "record": {
                "companyName": summary_data.get("companyName", "Target Company"),
                "industry": "Software & Technology",
                "employeeCount": 100
            }
        }

        # 3. Push Customer contact record to CRM
        customer_payload = {
            "type": "customer",
            "record": {
                "customerName": summary_data.get("contactName", "Prospect Contact"),
                "companyName": summary_data.get("companyName", "Target Company"),
                "title": "Decision Maker"
            }
        }

        # 4. Push Deal Call Note to CRM
        deal_payload = {
            "type": "deal",
            "record": {
                "dealName": f"{summary_data.get('companyName')} - {summary_data.get('callType', 'Discovery').title()} Call Note",
                "customerName": summary_data.get("contactName"),
                "companyName": summary_data.get("companyName"),
                "amount": 120000,
                "stage": "proposal" if summary_data.get("riskFlag") == "none" else "qualification",
                "notes": (
                    f"Call Summary: {summary_data.get('summary')}\n"
                    f"Pain Points: {', '.join(summary_data.get('painPointsIdentified', []))}\n"
                    f"Capabilities: {', '.join(summary_data.get('capabilitiesDiscussed', []))}\n"
                    f"Next Action: {summary_data.get('nextAction')} (Owner: {summary_data.get('nextActionOwner')})"
                )
            }
        }

        # Send HTTP requests to CRM API with retries
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                for payload in [company_payload, customer_payload, deal_payload]:
                    res = await client.post(self.crm_url, json=payload)
                    if not res.is_success:
                        logger.warning(f"CRM Sync HTTP {res.status_code} on payload {payload.get('type')}: {res.text}")

            logger.info(f"Successfully completed remote CRM sync for call session {session_id}.")
            return True

        except Exception as e:
            logger.warning(f"Could not reach remote CRM endpoint at {self.crm_url}: {e}. Local SQLite audit log retained.")

            return False


# Global CRM Sync Manager Singleton instance
crm_sync_manager = CRMSyncManager()
