# -*- coding: utf-8 -*-
"""
공통 유틸리티 함수
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Any, Optional

def setup_cors(app: FastAPI, origins: list = None):
    """CORS 미들웨어 설정"""
    if origins is None:
        origins = ["*"]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    return app

def create_webhook_response(
    success: bool,
    data: Any = None,
    error: Optional[str] = None,
    module: str = "image-generator"
) -> dict:
    """n8n 웹훅용 표준 응답 포맷"""
    return {
        "success": success,
        "module": module,
        "timestamp": datetime.now().isoformat(),
        "data": data,
        "error": error
    }
