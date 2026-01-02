# -*- coding: utf-8 -*-
"""
이미지 생성 모듈 - Replicate Flux 지원
독립 버전 (72놀이터용)
"""

import os
import json
from typing import Optional, Dict, Any
from datetime import datetime
from pathlib import Path

# 이미지 스타일 옵션
IMAGE_STYLES = [
    {"id": "realistic", "name": "실사/포토리얼", "name_en": "Photorealistic", "prompt_suffix": "photorealistic, high detail, professional photography, 8k resolution", "best_for": ["부동산", "금융", "비즈니스"]},
    {"id": "cinematic", "name": "시네마틱", "name_en": "Cinematic", "prompt_suffix": "cinematic lighting, movie scene, dramatic atmosphere, film grain", "best_for": ["스토리텔링", "드라마"]},
    {"id": "anime", "name": "애니메이션", "name_en": "Anime Style", "prompt_suffix": "anime style, vibrant colors, cel shading, Japanese animation", "best_for": ["엔터테인먼트", "게임"]},
    {"id": "illustration", "name": "일러스트", "name_en": "Digital Illustration", "prompt_suffix": "digital illustration, artistic, detailed line art", "best_for": ["교육", "인포그래픽"]},
    {"id": "3d", "name": "3D 렌더", "name_en": "3D Render", "prompt_suffix": "3D render, octane render, volumetric lighting, high detail", "best_for": ["기술", "제품"]},
    {"id": "watercolor", "name": "수채화", "name_en": "Watercolor", "prompt_suffix": "watercolor painting, soft colors, artistic brushstrokes", "best_for": ["감성", "힐링"]}
]
# 카메라 앵글
CAMERA_ANGLES = [
    {"id": "eye_level", "name": "아이레벨", "name_en": "eye level shot"},
    {"id": "low_angle", "name": "로우앵글", "name_en": "low angle shot, looking up"},
    {"id": "high_angle", "name": "하이앵글", "name_en": "high angle shot, looking down"},
    {"id": "birds_eye", "name": "버즈아이", "name_en": "bird's eye view, aerial shot"},
    {"id": "dutch_angle", "name": "더치앵글", "name_en": "dutch angle, tilted frame"},
    {"id": "over_shoulder", "name": "오버숄더", "name_en": "over the shoulder shot"}
]

# 샷 타입
SHOT_TYPES = [
    {"id": "extreme_closeup", "name": "익스트림 클로즈업", "name_en": "extreme close-up shot"},
    {"id": "closeup", "name": "클로즈업", "name_en": "close-up shot"},
    {"id": "medium", "name": "미디엄샷", "name_en": "medium shot"},
    {"id": "wide", "name": "와이드샷", "name_en": "wide shot"},
    {"id": "extreme_wide", "name": "익스트림 와이드", "name_en": "extreme wide shot"}
]

# 해상도 옵션
RESOLUTION_OPTIONS = [
    {"id": "hd", "name": "HD (1280px)", "value": "1280"},
    {"id": "2k", "name": "2K (1920px)", "value": "1920"},
    {"id": "4k", "name": "4K (3840px)", "value": "3840"}
]

# 이미지 비율 옵션
IMAGE_SIZE_OPTIONS = [
    {"id": "16:9", "name": "16:9 (가로)", "width": 1920, "height": 1080},
    {"id": "9:16", "name": "9:16 (세로)", "width": 1080, "height": 1920},
    {"id": "1:1", "name": "1:1 (정사각형)", "width": 1080, "height": 1080},
    {"id": "4:3", "name": "4:3 (클래식)", "width": 1440, "height": 1080}
]


class ImageGenerator:
    """Replicate Flux 이미지 생성기"""
    
    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = Path(__file__).parent.parent / "api_secrets.json"
        self.config = self._load_config(config_path)
        self.replicate_ready = False
        self._init_replicate()
    
    def _load_config(self, config_path) -> Dict:
        """설정 파일 로드"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    
    def _init_replicate(self):
        """Replicate 초기화"""
        replicate_key = self.config.get("replicate_api_token") or self.config.get("flux_api_key")
        if replicate_key:
            os.environ["REPLICATE_API_TOKEN"] = replicate_key
            self.replicate_ready = True
    
    def generate(
        self,
        prompt: str,
        style: str = "realistic",
        aspect_ratio: str = "16:9",
        resolution: str = "2k",
        camera_angle: Optional[str] = None,
        shot_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """이미지 생성"""
        final_prompt = self._build_prompt(prompt, style, camera_angle, shot_type, resolution)
        
        if self.replicate_ready:
            return self._generate_replicate(final_prompt, aspect_ratio)
        
        return {
            "success": False,
            "error": "Replicate API 키가 설정되지 않았습니다.",
            "provider": None
        }

    def _build_prompt(
        self,
        prompt: str,
        style: str,
        camera_angle: Optional[str],
        shot_type: Optional[str],
        resolution: str
    ) -> str:
        """최종 프롬프트 구성"""
        parts = [prompt]
        
        # 스타일 추가
        style_info = next((s for s in IMAGE_STYLES if s["id"] == style), IMAGE_STYLES[0])
        parts.append(style_info["prompt_suffix"])
        
        # 카메라 앵글 추가
        if camera_angle:
            angle_info = next((a for a in CAMERA_ANGLES if a["id"] == camera_angle), None)
            if angle_info:
                parts.append(angle_info["name_en"])
        
        # 샷 타입 추가
        if shot_type:
            shot_info = next((s for s in SHOT_TYPES if s["id"] == shot_type), None)
            if shot_info:
                parts.append(shot_info["name_en"])
        
        # 해상도 추가
        resolution_map = {"hd": "1280px", "2k": "1920px", "4k": "3840px"}
        parts.append(f"{resolution_map.get(resolution, '1920px')} resolution")
        
        return ", ".join(parts)
    
    def _generate_replicate(self, prompt: str, aspect_ratio: str) -> Dict[str, Any]:
        """Replicate Flux로 이미지 생성"""
        try:
            import replicate
            
            output = replicate.run(
                "black-forest-labs/flux-schnell",
                input={
                    "prompt": prompt,
                    "aspect_ratio": aspect_ratio,
                    "output_format": "webp",
                    "output_quality": 80
                }
            )
            
            if output:
                image_url = output[0] if isinstance(output, list) else str(output)
                return {
                    "success": True,
                    "image_url": image_url,
                    "provider": "replicate",
                    "prompt_used": prompt,
                    "generated_at": datetime.now().isoformat()
                }
            
            return {"success": False, "error": "이미지 생성 결과 없음", "provider": "replicate"}
            
        except Exception as e:
            return {"success": False, "error": str(e), "provider": "replicate"}
    
    def get_status(self) -> Dict[str, Any]:
        """현재 상태 반환"""
        return {
            "replicate_ready": self.replicate_ready,
            "styles_count": len(IMAGE_STYLES),
            "camera_angles_count": len(CAMERA_ANGLES),
            "shot_types_count": len(SHOT_TYPES)
        }


# 헬퍼 함수
def get_style_by_id(style_id: str) -> Dict:
    """스타일 ID로 스타일 정보 조회"""
    return next((s for s in IMAGE_STYLES if s["id"] == style_id), IMAGE_STYLES[0])

def get_all_options() -> Dict[str, Any]:
    """모든 옵션 반환"""
    return {
        "styles": IMAGE_STYLES,
        "camera_angles": CAMERA_ANGLES,
        "shot_types": SHOT_TYPES,
        "resolutions": RESOLUTION_OPTIONS,
        "sizes": IMAGE_SIZE_OPTIONS
    }

# 싱글톤 인스턴스
_generator_instance = None

def get_generator() -> ImageGenerator:
    """싱글톤 이미지 생성기 반환"""
    global _generator_instance
    if _generator_instance is None:
        _generator_instance = ImageGenerator()
    return _generator_instance
