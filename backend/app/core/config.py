#!/usr/bin/env python3
"""ERP Core — Python Backend Configuration"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "EYELEASH ERP Core"
    API_PREFIX: str = "/erp/api/v1"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://salon:salon123@localhost:5433/salon_v2"
    DB_ECHO: bool = False

    # Auth
    SECRET_KEY: str = "erp-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    # Document Number Registry
    DOC_SEQ_FORMAT: str = "{module}-{branch}-{date}-{seq:04d}"
    DEFAULT_BRANCH: str = "BSD"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 5000

    class Config:
        env_file = ".env"
        env_prefix = "ERP_"


settings = Settings()
