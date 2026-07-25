"""
Audio Recording, Time-Stamped Transcript Logger, and Call Monitoring Service.
Saves call audio streams as WAV files, outputs time-stamped transcript logs,
and records comprehensive audit events.
"""

import asyncio
import logging
import os
from pathlib import Path
import struct
import time
import wave
from typing import Dict, Any, List, Optional

from config import settings
from call_bot.webrtc_sip_client import AudioFrame

logger = logging.getLogger("DealFlow.CallBot.Recorder")


class CallRecorder:
    """
    Manages audio recording, transcript generation, and monitoring log writer for a call session.
    """

    def __init__(self, session_id: str, record_dir: Optional[Path] = None):
        self.session_id = session_id
        self.record_dir = record_dir or (Path(__file__).resolve().parent.parent / "recordings")
        self.record_dir.mkdir(parents=True, exist_ok=True)
        
        self.wav_path = self.record_dir / f"{self.session_id}.wav"
        self.transcript_path = self.record_dir / f"{self.session_id}_transcript.txt"
        
        self.audio_frames: List[bytes] = []
        self.transcript_entries: List[Dict[str, Any]] = []
        self.is_recording = False
        self._start_time = time.time()

    def start(self) -> None:
        """
        Starts call recording.
        """
        self.is_recording = True
        self._start_time = time.time()
        logger.info(f"Started audio & transcript recording for call session {self.session_id}.")

    def record_audio_frame(self, frame: AudioFrame) -> None:
        """
        Appends a PCM audio frame to the recording buffer.
        """
        if self.is_recording and frame.data:
            self.audio_frames.append(frame.data)

    def log_transcript(self, speaker: str, text: str) -> None:
        """
        Logs a time-stamped transcript entry.
        """
        elapsed = time.time() - self._start_time
        timestamp_str = time.strftime("%H:%M:%S", time.gmtime(elapsed))
        entry = {
            "timestamp": timestamp_str,
            "elapsed_seconds": round(elapsed, 2),
            "speaker": speaker,
            "text": text
        }
        self.transcript_entries.append(entry)
        logger.info(f"[{self.session_id}] [{timestamp_str}] {speaker}: {text}")

    async def finalize(self) -> Dict[str, Any]:
        """
        Finalizes recording, writes WAV file and transcript text file to disk.
        Returns details summary.
        """
        self.is_recording = False
        duration_sec = round(time.time() - self._start_time, 2)

        # 1. Write WAV file
        try:
            pcm_bytes = b"".join(self.audio_frames)
            with wave.open(str(self.wav_path), "wb") as wav_file:
                wav_file.setnchannels(1)           # Mono
                wav_file.setsampwidth(2)          # 16-bit PCM (2 bytes)
                wav_file.setframerate(settings.SAMPLE_RATE)
                wav_file.writeframes(pcm_bytes)
            logger.info(f"Saved call recording to {self.wav_path} ({len(pcm_bytes)} bytes, {duration_sec}s).")
        except Exception as e:
            logger.error(f"Failed to save WAV recording for {self.session_id}: {e}")

        # 2. Write Transcript file
        try:
            with open(self.transcript_path, "w", encoding="utf-8") as f:
                f.write(f"=== DealFlow Call Transcript - Session {self.session_id} ===\n")
                f.write(f"Duration: {duration_sec}s | Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                for entry in self.transcript_entries:
                    f.write(f"[{entry['timestamp']}] {entry['speaker']}: {entry['text']}\n")
            logger.info(f"Saved time-stamped transcript to {self.transcript_path}.")
        except Exception as e:
            logger.error(f"Failed to save transcript file for {self.session_id}: {e}")

        return {
            "session_id": self.session_id,
            "duration_seconds": duration_sec,
            "wav_path": str(self.wav_path),
            "transcript_path": str(self.transcript_path),
            "transcript_count": len(self.transcript_entries),
            "transcripts": self.transcript_entries
        }
