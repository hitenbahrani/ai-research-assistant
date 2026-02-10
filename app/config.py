from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MODELS_DIR = BASE_DIR / "models"
LLM_MODEL_PATH = MODELS_DIR / "mistral-7b-instruct.gguf"

DEFAULT_TOP_K = 5

WEB_TOP_K = 5
WEB_TIMEOUT_SECONDS = 15
MAX_WEB_CHARS = 9000

MODELS_DIR.mkdir(parents=True, exist_ok=True)
