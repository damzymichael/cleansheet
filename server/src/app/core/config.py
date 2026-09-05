from pydantic import SecretStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Annotated
from datetime import timedelta

NonEmptyStr = Annotated[str, Field(min_length=1)]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # keys are case-insensitive when being fetched from the env
    secret_key: SecretStr
    algorithm: str = "HS256"
    # Access token to expire in  minutes
    access_token_expire_minutes: int = 15
    # Refresh token to expire in days
    refresh_token_expire_days: int = 30
    cookie_secure: bool
    database_url: NonEmptyStr
    redis_url: NonEmptyStr
    frontend_url: str = "http://localhost:5173"


settings = Settings()  # type: ignore[call-arg] # Loaded from .env file
