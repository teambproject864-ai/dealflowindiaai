"""
Configuration settings for DealFlow AI Python Agent Service.
Loads settings from environment variables with safe defaults.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    # --- General Service Settings ---
    APP_NAME: str = "DealFlow AI Python Service"
    APP_VERSION: str = "2.0.0"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dealflow-secret-key-change-in-prod-32bytes!")

    # --- Database Settings ---
    DB_PATH: Path = BASE_DIR / os.getenv("DB_FILENAME", "whatsapp_callbot.db")

    # --- Evolution API (WhatsApp) Settings ---
    EVOLUTION_API_URL: str = os.getenv("EVOLUTION_API_URL", "http://localhost:8080").rstrip("/")
    EVOLUTION_API_KEY: str = os.getenv("EVOLUTION_API_KEY", "dealflow-evolution-key")
    EVOLUTION_INSTANCE_NAME: str = os.getenv("EVOLUTION_INSTANCE_NAME", "dealflow-instance")
    EVOLUTION_WEBSOCKET_URL: str = os.getenv(
        "EVOLUTION_WEBSOCKET_URL", 
        EVOLUTION_API_URL.replace("http://", "ws://").replace("https://", "wss://") + "/socket"
    )

    # --- Rate Limiting Settings ---
    MAX_MESSAGES_PER_SECOND: int = int(os.getenv("MAX_MESSAGES_PER_SECOND", "10"))
    RECIPIENT_COOLDOWN_SECONDS: float = float(os.getenv("RECIPIENT_COOLDOWN_SECONDS", "1.5"))

    # --- Live Call Bot Settings ---
    STT_PROVIDER: str = os.getenv("STT_PROVIDER", "deepgram")
    STT_API_KEY: str = os.getenv("DEEPGRAM_API_KEY", "")
    TTS_PROVIDER: str = os.getenv("TTS_PROVIDER", "elevenlabs")
    TTS_API_KEY: str = os.getenv("ELEVENLABS_API_KEY", "")
    TTS_VOICE_ID: str = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
    
    # --- Native Project LLMs & Provider APIs ---
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "dealflow-llm")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "mistralai/Mistral-7B-Instruct-v0.3")
    
    # Native LLM API Keys
    HUGGINGFACE_API_KEY: str = os.getenv("HUGGINGFACE_API_KEY", os.getenv("HF_TOKEN", ""))
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")
    KIMI_API_KEY: str = os.getenv("KIMI_API_KEY", "")

    # Latency Targets
    SUB_500MS_LATENCY_TARGET: int = 500  # ms
    SAMPLE_RATE: int = 16000             # Hz for PCM audio
    AUDIO_FRAME_DURATION_MS: int = 20    # Frame duration in ms

    # --- CRM Integration ---
    CRM_SYNC_ENABLED: bool = os.getenv("CRM_SYNC_ENABLED", "true").lower() == "true"
    CRM_API_BASE_URL: str = os.getenv("CRM_API_BASE_URL", "http://localhost:3000/api/crm")

settings = Settings()
