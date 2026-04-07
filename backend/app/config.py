"""
Askify Backend Configuration
Loads environment variables via Pydantic BaseSettings.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Supabase ──
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # ── Pinecone ──
    pinecone_api_key: str = ""
    pinecone_index_name: str = "askify-docs"
    pinecone_environment: str = "us-east-1"

    # ── Voyage AI ──
    voyage_api_key: str = ""

    # ── Gemini ──
    gemini_api_key: str = ""

    # ── App Config ──
    cors_origins: str = "http://localhost:3000"
    upload_max_size_mb: int = 10
    chunk_size: int = 512
    chunk_overlap: int = 50

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
