"""Runtime settings, read from environment variables (see .env.example)."""
import os


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:8080").split(",") if o.strip()]
SESSION_TTL_SECONDS = _int("SESSION_TTL_SECONDS", 1800)  # abandoned sessions are removed after this
MAX_SESSIONS = _int("MAX_SESSIONS", 64)
CLEANUP_INTERVAL_SECONDS = _int("CLEANUP_INTERVAL_SECONDS", 60)
MAX_SAMPLES = _int("MAX_SAMPLES", 2000)
