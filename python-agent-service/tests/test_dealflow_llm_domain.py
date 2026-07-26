"""
Unit tests for Python Call Bot & LLM Orchestrator DealFlow Domain Coverage.
Verifies domain concept resolution, intent scoring, and call bot orchestration rules.
"""

import sys
import os
import unittest


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from call_bot.llm_orchestration import StreamingLLMOrchestrator
from call_bot.lead_qualifier import lead_qualifier


class TestDealflowLLMDomainKnowledge(unittest.TestCase):
    """
    Test suite for DealFlow domain knowledge resolution in Python Agent Service.
    """

    def setUp(self):
        self.orchestrator = StreamingLLMOrchestrator()

    def test_lead_qualifier_domain_extraction(self):
        """
        Verify LeadQualifier extracts pain points, capabilities, and call summaries accurately.
        """
        transcript_history = [
            {"speaker": "Prospect", "text": "We have manual pipeline tracking and slow lead response times with high cost."},
            {"speaker": "Agent", "text": "DealFlow AI automates live WebRTC calls and real-time CRM synchronization."}
        ]
        
        summary = lead_qualifier.generate_call_summary(
            call_type="discovery",
            transcript_history=transcript_history,
            intake_data={"contactName": "Sarah Jenkins", "companyName": "Acme Corp"}
        )

        self.assertEqual(summary["callType"], "discovery")
        self.assertEqual(summary["contactName"], "Sarah Jenkins")
        self.assertEqual(summary["companyName"], "Acme Corp")
        self.assertTrue(len(summary["painPointsIdentified"]) > 0)
        self.assertIn("Manual pipeline tracking & slow lead response times", summary["painPointsIdentified"])
        self.assertIn("DealFlow AI Live Call Agent", summary["capabilitiesDiscussed"])

    def test_orchestrator_prompts_aligned_with_gtm(self):
        """
        Verify StreamingLLMOrchestrator system prompt incorporates DealFlow GTM goals.
        """
        from call_bot.llm_orchestration import DEALFLOW_SYSTEM_PROMPT
        self.assertIn("DealFlow", DEALFLOW_SYSTEM_PROMPT)
        self.assertIn("Executive GTM Assistant", DEALFLOW_SYSTEM_PROMPT)


if __name__ == "__main__":
    unittest.main()
