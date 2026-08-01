import sys
from pathlib import Path

# Add python-agent-service folder to sys.path so modules like call_bot and whatsapp resolve cleanly
SERVICE_DIR = Path(__file__).resolve().parent.parent
if str(SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(SERVICE_DIR))
