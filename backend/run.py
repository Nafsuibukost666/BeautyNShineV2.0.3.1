#!/usr/bin/env python3
"""ERP Core — Entry point.

Run with::

    python run.py          # development (reload on)
    python run.py --no-reload  # production
"""
import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
