import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    email_user: str = "costrasphere@gmail.com"
    email_password: str = ""
    jwt_secret: str = "CostraSphereJWTSecret2026"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    database_url: str = "sqlite:///./costrasphere.db"
    frontend_url: str = "http://localhost:5173"
    otp_expire_minutes: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
