"""
Live Call Bot Session Manager.
Orchestrates the full real-time bidirectional call loop:
WebRTC Audio Frame -> STT Streamer -> LLM Orchestration -> TTS Streamer -> WebRTC Audio Queue.
Implements sub-500ms response targets, instant barge-in / speech interruption handling,
call recording, lead qualification, and CRM synchronization.
"""

import asyncio
import logging
import time
from typing import Dict, Any, Optional, List

from config import settings
from call_bot.webrtc_sip_client import WebRTCSIPSession, AudioFrame
from call_bot.stt_streamer import StreamingSTTProcessor, TranscriptChunk
from call_bot.tts_streamer import StreamingTTSProcessor
from call_bot.llm_orchestration import StreamingLLMOrchestrator
from call_bot.lead_qualifier import lead_qualifier
from call_bot.crm_sync import crm_sync_manager
from call_bot.call_recorder import CallRecorder
from whatsapp.database import db_manager

logger = logging.getLogger("DealFlow.CallBot.SessionManager")


class ActiveCallSession:
    """
    State container for an active live call session.
    """

    def __init__(self, session_id: str, call_type: str = "discovery", intake_context: Optional[Dict[str, Any]] = None):
        self.session_id = session_id
        self.call_type = call_type
        self.intake_context = intake_context or {}

        # Components
        self.webrtc_session = WebRTCSIPSession(session_id=session_id, call_type=call_type)
        self.stt_processor = StreamingSTTProcessor()
        self.tts_processor = StreamingTTSProcessor()
        self.llm_orchestrator = StreamingLLMOrchestrator()
        self.recorder = CallRecorder(session_id=session_id)

        # State tracking
        self.is_running = False
        self.conversation_history: List[Dict[str, str]] = []
        self.active_turn_task: Optional[asyncio.Task] = None
        self.is_bot_speaking = False

    async def start(self, sdp_offer: Optional[str] = None) -> Dict[str, Any]:
        """
        Starts WebRTC session, recording, STT listener, and audio loop.
        """
        if self.is_running:
            return {"session_id": self.session_id, "status": "already_running"}

        self.is_running = True
        conn_res = await self.webrtc_session.connect(sdp_offer)
        self.recorder.start()

        # Register STT final transcript callback
        self.stt_processor.register_callback(self._on_user_transcript)

        # Start background audio processing loops
        asyncio.create_task(self._inbound_audio_loop())

        await db_manager.log_audit_event("call_bot", "session_started", {
            "session_id": self.session_id,
            "call_type": self.call_type
        })

        return conn_res

    async def stop(self) -> Dict[str, Any]:
        """
        Stops call session, finalizes recording, extracts lead qualification metrics,
        and pushes CallSummary to Dealflow CRM.
        """
        if not self.is_running:
            return {"session_id": self.session_id, "status": "already_stopped"}

        self.is_running = False
        
        # Cancel any active turn generation task
        if self.active_turn_task and not self.active_turn_task.done():
            self.active_turn_task.cancel()

        await self.webrtc_session.disconnect()

        # Finalize audio & transcript recording
        recording_summary = await self.recorder.finalize()

        # Generate structured CallSummary JSON
        summary_json = lead_qualifier.generate_call_summary(
            call_type=self.call_type,
            transcript_history=self.conversation_history,
            intake_data=self.intake_context
        )

        # Sync CallSummary to Dealflow CRM
        await crm_sync_manager.sync_call_summary(self.session_id, summary_json)

        await db_manager.log_audit_event("call_bot", "session_stopped", {
            "session_id": self.session_id,
            "duration": recording_summary.get("duration_seconds")
        })

        return {
            "session_id": self.session_id,
            "status": "completed",
            "recording": recording_summary,
            "summary": summary_json
        }

    async def _inbound_audio_loop(self) -> None:
        """
        Continuous loop consuming incoming WebRTC audio frames.
        Performs real-time barge-in detection and passes frames to STT streamer & recorder.
        """
        while self.is_running:
            frame = await self.webrtc_session.inbound_audio_queue.get()
            if not frame:
                continue

            # Record raw frame
            self.recorder.record_audio_frame(frame)

            # Barge-in Interruption Detection:
            # If user starts speaking (energy above VAD threshold) while bot is speaking/playing audio:
            if self.webrtc_session.is_user_speaking and self.is_bot_speaking:
                logger.info(f"[{self.session_id}] Barge-in / Speech Interruption detected! Cancelling active bot turn...")
                self._handle_barge_in_interruption()

            # Pass audio frame to Speech-to-Text processor
            await self.stt_processor.process_audio_frame(frame)

    def _handle_barge_in_interruption(self) -> None:
        """
        Cancels active LLM generation task and flushes outbound WebRTC audio queue immediately.
        """
        self.is_bot_speaking = False
        if self.active_turn_task and not self.active_turn_task.done():
            self.active_turn_task.cancel()
        
        # Flush pending outbound audio frames immediately
        self.webrtc_session.flush_outbound_queue()

    def _on_user_transcript(self, chunk: TranscriptChunk) -> None:
        """
        Callback fired when STT produces a final user transcript chunk.
        """
        if not chunk.text.strip():
            return

        text = chunk.text.strip()
        logger.info(f"[{self.session_id}] User STT Transcript: '{text}'")

        # Log transcript to recorder and history
        self.recorder.log_transcript("User", text)
        self.conversation_history.append({"role": "user", "content": text, "speaker": "User"})

        # Barge-in check: cancel any lingering turn
        if self.is_bot_speaking:
            self._handle_barge_in_interruption()

        # Trigger new turn processing task
        self.active_turn_task = asyncio.create_task(self._process_call_turn(text))

    async def _process_call_turn(self, user_text: str) -> None:
        """
        Orchestrates single call turn: LLM response stream -> TTS stream -> Outbound WebRTC queue.
        Enforces sub-500ms response targets.
        """
        turn_start = time.monotonic()
        self.is_bot_speaking = True

        try:
            full_bot_response = ""
            first_chunk = True

            # 1. Stream LLM tokens
            async for text_delta in self.llm_orchestrator.generate_response_stream(
                user_utterance=user_text,
                call_type=self.call_type,
                intake_context=self.intake_context,
                conversation_history=self.conversation_history
            ):
                if not self.is_running or not self.is_bot_speaking:
                    break

                full_bot_response += text_delta

                # 2. Stream TTS audio frames for text delta
                async for audio_frame in self.tts_processor.generate_audio_stream(text_delta):
                    if not self.is_running or not self.is_bot_speaking:
                        break

                    if first_chunk:
                        first_chunk = False
                        latency_ms = (time.monotonic() - turn_start) * 1000.0
                        logger.info(f"[{self.session_id}] Full Turn Audio Latency: {latency_ms:.1f}ms (Sub-500ms target).")

                    # Push audio frame to WebRTC outbound playback queue
                    await self.webrtc_session.outbound_audio_queue.put(audio_frame)

            if full_bot_response.strip():
                logger.info(f"[{self.session_id}] Bot Turn Completed: '{full_bot_response.strip()}'")
                self.recorder.log_transcript("Praneeth Assist (AI)", full_bot_response.strip())
                self.conversation_history.append({"role": "assistant", "content": full_bot_response.strip(), "speaker": "Praneeth Assist"})

        except asyncio.CancelledError:
            logger.info(f"[{self.session_id}] Turn processing task cancelled due to interruption.")
        except Exception as e:
            logger.error(f"[{self.session_id}] Error in call turn loop: {e}")
        finally:
            self.is_bot_speaking = False


class CallSessionManager:
    """
    Manages active live call bot sessions across the application.
    """

    def __init__(self):
        self.active_sessions: Dict[str, ActiveCallSession] = {}

    async def create_session(
        self,
        call_type: str = "discovery",
        meeting_url: Optional[str] = None,
        intake_context: Optional[Dict[str, Any]] = None
    ) -> ActiveCallSession:
        """
        Creates and registers a new active call session.
        """
        import uuid
        session_id = f"call-{uuid.uuid4().hex[:8]}"
        session = ActiveCallSession(session_id=session_id, call_type=call_type, intake_context=intake_context)
        self.active_sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[ActiveCallSession]:
        return self.active_sessions.get(session_id)

    async def end_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        session = self.active_sessions.get(session_id)
        if session:
            result = await session.stop()
            self.active_sessions.pop(session_id, None)
            return result
        return None


# Global Call Session Manager Singleton instance
call_session_manager = CallSessionManager()
