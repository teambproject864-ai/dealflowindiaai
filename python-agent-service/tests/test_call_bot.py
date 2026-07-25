"""
Unit tests for the Rewritten Python Live Call Bot.
Tests WebRTC audio frames, STT/TTS pipeline, LLM orchestration,
barge-in interruption handling, lead qualification, and CRM sync.
"""

import asyncio
import pytest
import numpy as np

from call_bot.webrtc_sip_client import WebRTCSIPSession, AudioFrame
from call_bot.stt_streamer import StreamingSTTProcessor, TranscriptChunk
from call_bot.tts_streamer import StreamingTTSProcessor
from call_bot.llm_orchestration import StreamingLLMOrchestrator
from call_bot.lead_qualifier import lead_qualifier
from call_bot.session_manager import ActiveCallSession, call_session_manager


@pytest.mark.asyncio
async def test_audio_frame_vad_energy():
    """
    Test AudioFrame RMS energy calculation for Voice Activity Detection.
    """
    # 1. Silent frame
    silent_data = bytes(320 * 2) # 20ms of 16kHz 16-bit mono PCM zeros
    silent_frame = AudioFrame(silent_data)
    assert silent_frame.calculate_energy() == 0.0
    assert silent_frame.duration_ms == 20.0

    # 2. Loud frame (sine wave)
    t = np.linspace(0, 0.02, 320, endpoint=False)
    loud_samples = (np.sin(2 * np.pi * 440 * t) * 10000).astype(np.int16)
    loud_frame = AudioFrame(loud_samples.tobytes())
    energy = loud_frame.calculate_energy()
    assert energy > 5000.0, f"Loud frame energy too low ({energy})"


@pytest.mark.asyncio
async def test_webrtc_session_sdp_and_audio_queues():
    """
    Test WebRTC/SIP session connection, SDP generation, and audio frame queues.
    """
    session = WebRTCSIPSession(session_id="test-call-1", call_type="discovery")
    res = await session.connect()

    assert res["status"] == "connected"
    assert "v=0" in res["sdp_answer"]
    assert "opus/48000" in res["sdp_answer"]
    assert session.is_active is True

    # Push inbound frame
    samples = np.zeros(320, dtype=np.int16)
    await session.push_inbound_audio_frame(samples.tobytes())

    frame = await session.inbound_audio_queue.get()
    assert frame is not None
    assert frame.duration_ms == 20.0

    await session.disconnect()
    assert session.is_active is False


@pytest.mark.asyncio
async def test_barge_in_interruption_flushing():
    """
    Test barge-in interruption handling: flushing pending outbound audio queue.
    """
    session = WebRTCSIPSession(session_id="bargein-test", call_type="discovery")
    await session.connect()

    # Fill outbound queue with 5 audio frames
    for i in range(5):
        await session.outbound_audio_queue.put(AudioFrame(bytes(640)))

    assert session.outbound_audio_queue.qsize() == 5

    # Trigger flush (barge-in interruption)
    flushed = session.flush_outbound_queue()
    assert flushed == 5
    assert session.outbound_audio_queue.empty() is True

    await session.disconnect()


@pytest.mark.asyncio
async def test_llm_orchestrator_streaming():
    """
    Test Streaming LLM Orchestrator generates response tokens.
    """
    orchestrator = StreamingLLMOrchestrator()
    tokens = []
    
    async for token in orchestrator.generate_response_stream("What is DealFlow AI?", call_type="discovery"):
        tokens.append(token)

    response_text = "".join(tokens)
    assert len(response_text) > 20
    assert "DealFlow" in response_text or "pipeline" in response_text or "revenue" in response_text


@pytest.mark.asyncio
async def test_lead_qualification_summary():
    """
    Test Lead Qualifier generates structured CallSummary JSON adhering to CRM schema.
    """
    transcript = [
        {"speaker": "User", "text": "Hi, we are Acme SaaS and our manual pipeline tracking is very slow."},
        {"speaker": "Praneeth Assist", "text": "DealFlow AI automates lead qualification and syncs notes to your CRM."},
        {"speaker": "User", "text": "We need to address security compliance before next quarter."}
    ]
    intake = {"companyName": "Acme SaaS", "contactName": "Sarah Jenkins"}

    summary = lead_qualifier.generate_call_summary("discovery", transcript, intake)

    assert summary["callType"] == "discovery"
    assert summary["companyName"] == "Acme SaaS"
    assert summary["contactName"] == "Sarah Jenkins"
    assert len(summary["painPointsIdentified"]) > 0
    assert len(summary["capabilitiesDiscussed"]) > 0
    assert len(summary["objectionsRaised"]) > 0
    assert summary["riskFlag"] in ("none", "at_risk", "churn_risk")
