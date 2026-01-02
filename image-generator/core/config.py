# -*- coding: utf-8 -*-
"""
공통 설정 관리 - 독립 버전
"""
import os
import json
from pathlib import Path
from typing import Optional

class Config:
    """API 키 및 설정 관리"""
    
    PROJECT_ROOT = Path(__file__).parent.parent
    SECRETS_PATH = PROJECT_ROOT / "api_secrets.json"
    
    _secrets: Optional[dict] = None
    
    @classmethod
    def _load_secrets(cls) -> dict:
        """api_secrets.json에서 키 로드"""
        if cls._secrets is None:
            if cls.SECRETS_PATH.exists():
                with open(cls.SECRETS_PATH, 'r', encoding='utf-8') as f:
                    cls._secrets = json.load(f)
            else:
                cls._secrets = {}
        return cls._secrets
    
    @classmethod
    def reload(cls):
        """설정 다시 로드"""
        cls._secrets = None
        return cls._load_secrets()
    
    @classmethod
    def get(cls, key: str, default: str = "") -> str:
        """설정값 가져오기 (환경변수 우선)"""
        env_val = os.getenv(key.upper())
        if env_val:
            return env_val
        secrets = cls._load_secrets()
        return secrets.get(key, default)
    
    @classmethod
    def get_gemini_api_key(cls) -> str:
        return cls.get('gemini_api_key')
    
    @classmethod
    def get_replicate_api_token(cls) -> str:
        return cls.get('replicate_api_token') or cls.get('flux_api_key')
    
    @classmethod
    def save_key(cls, service: str, api_key: str) -> bool:
        """API 키 저장"""
        try:
            secrets = cls._load_secrets()
            key_map = {
                'replicate': 'replicate_api_token',
                'gemini': 'gemini_api_key'
            }
            actual_key = key_map.get(service, service)
            secrets[actual_key] = api_key
            
            with open(cls.SECRETS_PATH, 'w', encoding='utf-8') as f:
                json.dump(secrets, f, indent=2, ensure_ascii=False)
            
            cls._secrets = None  # 캐시 초기화
            return True
        except Exception as e:
            print(f"키 저장 실패: {e}")
            return False
