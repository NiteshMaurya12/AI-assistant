import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Aether AI Assistant"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/aether_ai")
    DEFAULT_MODEL: str = "gemini-3.8-flash"
    TTS_MODEL: str = "gemini-3.8-flash-lite-tts"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
