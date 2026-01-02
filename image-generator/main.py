# -*- coding: utf-8 -*-
"""
AI 이미지 생성기 v2.5 - 미드저니 스타일 프롬프트 + 확장 디자이너 + Vertex AI
72놀이터 독립 모듈
"""

import os
import json
import asyncio
import httpx
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ============================================
# App Setup
# ============================================
app = FastAPI(title="AI 이미지 생성기", version="2.6.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 경로 설정
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
TEMPLATES_DIR = BASE_DIR / "templates"
DATA_DIR.mkdir(exist_ok=True)
TEMPLATES_DIR.mkdir(exist_ok=True)

# ============================================
# 런타임 설정 (API 키 등)
# ============================================
runtime_settings = {
    "api_keys": {
        "openai": "",
        "replicate": "",
        "gemini": "",
        "claude": "",
        "vertex": ""
    },
    "default_provider": "dalle3"
}

def load_api_keys():
    """api_secrets.json에서 키 로드"""
    secrets_path = BASE_DIR / "api_secrets.json"
    if secrets_path.exists():
        with open(secrets_path, 'r', encoding='utf-8') as f:
            secrets = json.load(f)
            runtime_settings["api_keys"]["openai"] = secrets.get("openai_api_key", "")
            runtime_settings["api_keys"]["replicate"] = secrets.get("replicate_api_token", "") or secrets.get("flux_api_key", "")
            runtime_settings["api_keys"]["gemini"] = secrets.get("gemini_api_key", "")
            runtime_settings["api_keys"]["claude"] = secrets.get("claude_api_key", "")
            runtime_settings["api_keys"]["vertex"] = secrets.get("vertex_api_key", "") or secrets.get("google_cloud_key", "")

load_api_keys()

# ============================================
# 카테고리 그룹 정의
# ============================================
CATEGORY_GROUPS = {
    "video": {
        "name": "🎬 영상",
        "description": "영상 제작에 최적화된 스타일",
        "categories": ["video", "vlog", "news", "education", "entertainment"]
    },
    "art": {
        "name": "🎨 아트",
        "description": "예술적 표현 스타일",
        "categories": ["art"]
    },
    "cartoon": {
        "name": "📚 만화",
        "description": "만화/애니메이션 스타일",
        "categories": ["webtoon", "anime", "cartoon", "comic", "simple"]
    },
    "photo": {
        "name": "📷 실사",
        "description": "사진같은 실사 스타일",
        "categories": ["photo", "realestate", "food", "tech"]
    },
    "design": {
        "name": "📐 디자인",
        "description": "그래픽 디자인 스타일",
        "categories": ["design"]
    },
    "special": {
        "name": "✨ 특수",
        "description": "특수 효과 스타일",
        "categories": ["scifi", "fantasy", "retro"]
    }
}

# 즐겨찾기 저장/로드
def get_favorites() -> List[str]:
    """즐겨찾기 디자이너 ID 목록 반환"""
    path = DATA_DIR / "favorites.json"
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_favorites(favorites: List[str]):
    """즐겨찾기 저장"""
    path = DATA_DIR / "favorites.json"
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(favorites, f, ensure_ascii=False, indent=2)

def add_favorite(designer_id: str) -> bool:
    """즐겨찾기 추가"""
    favorites = get_favorites()
    if designer_id not in favorites:
        favorites.append(designer_id)
        save_favorites(favorites)
        return True
    return False

def remove_favorite(designer_id: str) -> bool:
    """즐겨찾기 제거"""
    favorites = get_favorites()
    if designer_id in favorites:
        favorites.remove(designer_id)
        save_favorites(favorites)
        return True
    return False

# ============================================
# 확장 프리셋 디자이너 (20종 이상)
# ============================================
PRESET_DESIGNERS = {
    # 영상 스타일
    "cinematic_pro": {
        "id": "cinematic_pro",
        "name": "🎬 시네마틱 프로",
        "description": "영화 같은 드라마틱한 스타일",
        "category": "video",
        "is_preset": True,
        "prompt_prefix": "[cinematic lighting, dramatic atmosphere, film grain] ",
        "prompt_suffix": " --style cinematic --quality 4K --ar 16:9",
        "negative_prompt": "cartoon, anime, low quality, blurry, distorted",
        "best_for": ["다큐", "스토리텔링", "드라마"]
    },
    "bright_cheerful": {
        "id": "bright_cheerful",
        "name": "☀️ 밝고 친근",
        "description": "따뜻하고 접근하기 쉬운 스타일",
        "category": "vlog",
        "is_preset": True,
        "prompt_prefix": "[bright natural lighting, cheerful atmosphere] ",
        "prompt_suffix": " --style friendly --quality HD",
        "negative_prompt": "dark, scary, gloomy, horror, sad",
        "best_for": ["브이로그", "일상", "라이프스타일"]
    },
    "tech_modern": {
        "id": "tech_modern",
        "name": "🖥️ 테크 모던",
        "description": "깔끔한 기술/IT 스타일",
        "category": "tech",
        "is_preset": True,
        "prompt_prefix": "[modern tech aesthetic, clean lines, minimalist] ",
        "prompt_suffix": " --style futuristic --quality 4K",
        "negative_prompt": "vintage, old, rustic, messy, cluttered",
        "best_for": ["IT", "리뷰", "테크"]
    },
    "gaming": {
        "id": "gaming",
        "name": "🎮 게이머 스타일",
        "description": "게임/엔터테인먼트 스타일",
        "category": "entertainment",
        "is_preset": True,
        "prompt_prefix": "[gaming aesthetic, neon lights, RGB colors, dynamic action] ",
        "prompt_suffix": " --style esports --quality HD --vivid",
        "negative_prompt": "boring, plain, muted colors, static",
        "best_for": ["게임", "e스포츠", "엔터테인먼트"]
    },
    "education_clean": {
        "id": "education_clean",
        "name": "📚 교육 클린",
        "description": "깔끔하고 집중하기 좋은 스타일",
        "category": "education",
        "is_preset": True,
        "prompt_prefix": "[clean educational style, simple background, clear focus] ",
        "prompt_suffix": " --style informative --quality HD",
        "negative_prompt": "distracting, busy background, cluttered, confusing",
        "best_for": ["강의", "튜토리얼", "설명"]
    },
    "food_photography": {
        "id": "food_photography",
        "name": "🍳 푸드 맛있게",
        "description": "음식이 맛있어 보이는 스타일",
        "category": "food",
        "is_preset": True,
        "prompt_prefix": "[food photography, appetizing, warm lighting] ",
        "prompt_suffix": " --style delicious --quality 4K --bokeh",
        "negative_prompt": "unappetizing, cold, bland, poorly lit",
        "best_for": ["먹방", "요리", "레시피"]
    },
    "realestate_pro": {
        "id": "realestate_pro",
        "name": "🏠 부동산 프로",
        "description": "전문적인 부동산 스타일",
        "category": "realestate",
        "is_preset": True,
        "prompt_prefix": "[professional real estate photography, warm natural lighting] ",
        "prompt_suffix": " --style architectural --quality 4K --wide",
        "negative_prompt": "dark, cramped, messy, low quality, distorted",
        "best_for": ["부동산", "인테리어", "건축"]
    },
    "news_info": {
        "id": "news_info",
        "name": "📰 뉴스/정보",
        "description": "신뢰감 있는 정보 전달 스타일",
        "category": "news",
        "is_preset": True,
        "prompt_prefix": "[news broadcast style, professional, trustworthy] ",
        "prompt_suffix": " --style broadcast --quality HD",
        "negative_prompt": "unprofessional, chaotic, unreliable looking",
        "best_for": ["정보", "뉴스", "분석"]
    },
    
    # 만화/애니메이션 스타일
    "webtoon_korean": {
        "id": "webtoon_korean",
        "name": "🇰🇷 한국 웹툰",
        "description": "한국 웹툰 스타일",
        "category": "webtoon",
        "is_preset": True,
        "prompt_prefix": "[Korean webtoon style, manhwa art, clean line art, vibrant colors] ",
        "prompt_suffix": " --style webtoon --quality HD --niji 6",
        "negative_prompt": "3D, realistic, photograph, blurry",
        "best_for": ["웹툰", "만화", "스토리"]
    },
    "webtoon_japanese": {
        "id": "webtoon_japanese",
        "name": "🇯🇵 일본 만화",
        "description": "일본 만화/애니메이션 스타일",
        "category": "anime",
        "is_preset": True,
        "prompt_prefix": "[Japanese manga style, anime art, detailed shading] ",
        "prompt_suffix": " --style anime --niji 6 --quality HD",
        "negative_prompt": "realistic, photograph, 3D render",
        "best_for": ["애니메이션", "만화", "일러스트"]
    },
    "stickman": {
        "id": "stickman",
        "name": "🧍 스틱맨",
        "description": "심플한 막대 인형 스타일",
        "category": "simple",
        "is_preset": True,
        "prompt_prefix": "[simple stick figure drawing, minimal art, black and white] ",
        "prompt_suffix": " --style minimalist --simple",
        "negative_prompt": "detailed, realistic, colorful, complex",
        "best_for": ["설명", "교육", "개념도"]
    },
    "cartoon_disney": {
        "id": "cartoon_disney",
        "name": "🏰 디즈니 카툰",
        "description": "디즈니/픽사 스타일 3D 카툰",
        "category": "cartoon",
        "is_preset": True,
        "prompt_prefix": "[Disney Pixar style, 3D cartoon, expressive characters] ",
        "prompt_suffix": " --style disney --quality 4K --render 3D",
        "negative_prompt": "realistic, dark, scary, horror",
        "best_for": ["애니메이션", "키즈", "가족"]
    },
    "comic_marvel": {
        "id": "comic_marvel",
        "name": "🦸 마블 코믹스",
        "description": "미국 코믹북 스타일",
        "category": "comic",
        "is_preset": True,
        "prompt_prefix": "[American comic book style, bold colors, dynamic poses, halftone dots] ",
        "prompt_suffix": " --style comic --quality HD --bold",
        "negative_prompt": "photograph, realistic, anime, soft",
        "best_for": ["히어로", "액션", "스토리"]
    },
    
    # 아트 스타일
    "watercolor": {
        "id": "watercolor",
        "name": "🎨 수채화",
        "description": "부드러운 수채화 스타일",
        "category": "art",
        "is_preset": True,
        "prompt_prefix": "[watercolor painting, soft colors, artistic brushstrokes] ",
        "prompt_suffix": " --style watercolor --artistic",
        "negative_prompt": "digital, harsh, sharp lines, photograph",
        "best_for": ["감성", "아트", "힐링"]
    },
    "oil_painting": {
        "id": "oil_painting",
        "name": "🖼️ 유화",
        "description": "클래식 유화 스타일",
        "category": "art",
        "is_preset": True,
        "prompt_prefix": "[oil painting style, classical art, rich textures, masterpiece] ",
        "prompt_suffix": " --style painting --artistic --museum",
        "negative_prompt": "digital, modern, cartoon, photograph",
        "best_for": ["클래식", "아트", "고급"]
    },
    "sketch_pencil": {
        "id": "sketch_pencil",
        "name": "✏️ 연필 스케치",
        "description": "연필 드로잉 스타일",
        "category": "art",
        "is_preset": True,
        "prompt_prefix": "[pencil sketch, hand-drawn, detailed line work] ",
        "prompt_suffix": " --style sketch --monochrome",
        "negative_prompt": "color, digital, photograph, painting",
        "best_for": ["콘셉트", "드로잉", "스케치"]
    },
    "pop_art": {
        "id": "pop_art",
        "name": "🎆 팝아트",
        "description": "앤디 워홀 스타일 팝아트",
        "category": "art",
        "is_preset": True,
        "prompt_prefix": "[pop art style, bold colors, Andy Warhol inspired, retro] ",
        "prompt_suffix": " --style popart --vivid --retro",
        "negative_prompt": "realistic, photograph, muted colors",
        "best_for": ["레트로", "아트", "디자인"]
    },
    
    # 사진/실사 스타일
    "photo_portrait": {
        "id": "photo_portrait",
        "name": "📸 인물 사진",
        "description": "프로페셔널 인물 사진",
        "category": "photo",
        "is_preset": True,
        "prompt_prefix": "[professional portrait photography, studio lighting, sharp focus] ",
        "prompt_suffix": " --style portrait --quality 4K --bokeh",
        "negative_prompt": "cartoon, anime, blurry, distorted",
        "best_for": ["인물", "프로필", "초상"]
    },
    "photo_landscape": {
        "id": "photo_landscape",
        "name": "🏔️ 풍경 사진",
        "description": "아름다운 풍경 사진",
        "category": "photo",
        "is_preset": True,
        "prompt_prefix": "[landscape photography, golden hour, stunning scenery] ",
        "prompt_suffix": " --style landscape --quality 4K --wide",
        "negative_prompt": "urban, indoor, people, artificial",
        "best_for": ["풍경", "여행", "자연"]
    },
    "photo_product": {
        "id": "photo_product",
        "name": "📦 제품 사진",
        "description": "제품 촬영 스타일",
        "category": "photo",
        "is_preset": True,
        "prompt_prefix": "[product photography, clean white background, professional lighting] ",
        "prompt_suffix": " --style product --quality 4K --sharp",
        "negative_prompt": "messy, dark, cluttered, busy background",
        "best_for": ["제품", "광고", "커머스"]
    },
    
    # 특수 스타일
    "cyberpunk": {
        "id": "cyberpunk",
        "name": "🌃 사이버펑크",
        "description": "네온 사이버펑크 스타일",
        "category": "scifi",
        "is_preset": True,
        "prompt_prefix": "[cyberpunk aesthetic, neon lights, futuristic city, rain] ",
        "prompt_suffix": " --style cyberpunk --neon --dark",
        "negative_prompt": "bright daylight, nature, rural, vintage",
        "best_for": ["SF", "미래", "테크"]
    },
    "fantasy_epic": {
        "id": "fantasy_epic",
        "name": "🐉 판타지 에픽",
        "description": "장대한 판타지 스타일",
        "category": "fantasy",
        "is_preset": True,
        "prompt_prefix": "[epic fantasy art, dramatic lighting, magical atmosphere] ",
        "prompt_suffix": " --style fantasy --epic --quality 4K",
        "negative_prompt": "modern, urban, technology, mundane",
        "best_for": ["판타지", "게임", "스토리"]
    },
    "vintage_retro": {
        "id": "vintage_retro",
        "name": "📼 빈티지 레트로",
        "description": "80-90년대 레트로 스타일",
        "category": "retro",
        "is_preset": True,
        "prompt_prefix": "[retro vintage style, 80s aesthetic, VHS effect, nostalgic] ",
        "prompt_suffix": " --style retro --vintage --grain",
        "negative_prompt": "modern, clean, digital, futuristic",
        "best_for": ["레트로", "복고", "감성"]
    },
    "isometric_3d": {
        "id": "isometric_3d",
        "name": "🧊 아이소메트릭 3D",
        "description": "아이소메트릭 뷰 3D 일러스트",
        "category": "design",
        "is_preset": True,
        "prompt_prefix": "[isometric 3D illustration, clean design, geometric shapes] ",
        "prompt_suffix": " --style isometric --3D --clean",
        "negative_prompt": "realistic, photograph, organic, messy",
        "best_for": ["인포그래픽", "디자인", "설명"]
    },
    "flat_design": {
        "id": "flat_design",
        "name": "📐 플랫 디자인",
        "description": "미니멀 플랫 디자인",
        "category": "design",
        "is_preset": True,
        "prompt_prefix": "[flat design, minimal illustration, simple shapes, bold colors] ",
        "prompt_suffix": " --style flat --minimal --vector",
        "negative_prompt": "3D, realistic, complex, detailed, photograph",
        "best_for": ["UI", "아이콘", "인포그래픽"]
    },
    "lowpoly": {
        "id": "lowpoly",
        "name": "💎 로우폴리",
        "description": "로우폴리곤 3D 스타일",
        "category": "design",
        "is_preset": True,
        "prompt_prefix": "[low poly art, geometric, triangular shapes, 3D render] ",
        "prompt_suffix": " --style lowpoly --3D --geometric",
        "negative_prompt": "realistic, smooth, organic, photograph",
        "best_for": ["게임", "3D", "모던"]
    },
    "pixel_art": {
        "id": "pixel_art",
        "name": "👾 픽셀 아트",
        "description": "레트로 게임 픽셀 아트",
        "category": "retro",
        "is_preset": True,
        "prompt_prefix": "[pixel art, retro game style, 8-bit, 16-bit] ",
        "prompt_suffix": " --style pixel --retro --8bit",
        "negative_prompt": "realistic, smooth, high resolution, photograph",
        "best_for": ["게임", "레트로", "노스탤지아"]
    }
}

# 감정 → 영문 매핑
EMOTION_MAP = {
    "neutral": "calm and balanced mood",
    "curious": "intriguing and curious atmosphere",
    "happy": "joyful and happy mood",
    "sad": "melancholic and emotional",
    "excited": "energetic and exciting",
    "serious": "serious and professional",
    "warm": "warm and cozy feeling",
    "dramatic": "dramatic and intense",
    "surprise": "surprising and shocking",
    "fear": "tense and suspenseful",
    "anger": "intense and powerful",
    "love": "romantic and tender"
}

# ============================================
# Pydantic Models
# ============================================
class M06SceneImport(BaseModel):
    project_id: Optional[str] = None
    title: Optional[str] = None
    scenes: List[Dict[str, Any]]
    thumbnail_suggestions: Optional[List[Dict]] = None

class PromptGenerateRequest(BaseModel):
    scenes: List[Dict[str, Any]]
    designer_id: str = "bright_cheerful"

class ImageGenerateRequest(BaseModel):
    prompt_en: str
    negative_prompt: Optional[str] = ""
    provider: str = "dalle3"
    size: str = "1792x1024"

class BatchGenerateRequest(BaseModel):
    prompts: List[Dict[str, Any]]
    provider: str = "dalle3"
    designer_id: Optional[str] = None

class CustomDesigner(BaseModel):
    name: str
    description: str
    category: str = "custom"
    prompt_prefix: str
    prompt_suffix: str
    negative_prompt: str = ""
    best_for: List[str] = []

class ApiKeyTest(BaseModel):
    provider: str
    api_key: str

class KoToEnRequest(BaseModel):
    korean_description: Optional[str] = None
    korean_text: Optional[str] = None  # 프론트엔드 호환용
    designer_id: str = "bright_cheerful"
    ai_provider: str = "gemini"

class RecommendDesignerRequest(BaseModel):
    description: str = ""
    scenes: Optional[List[Dict[str, Any]]] = None  # 대본 분석용 장면 데이터
    ai_provider: str = "gemini"

# ============================================
# 디자이너 관리 함수
# ============================================
def get_custom_designers() -> Dict:
    path = DATA_DIR / "designers.json"
    if path.exists():
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_custom_designers(designers: Dict):
    path = DATA_DIR / "designers.json"
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(designers, f, ensure_ascii=False, indent=2)

def get_all_designers() -> Dict:
    custom = get_custom_designers()
    return {**PRESET_DESIGNERS, **custom}

def get_designer(designer_id: str) -> Optional[Dict]:
    return get_all_designers().get(designer_id)

# ============================================
# 프롬프트 생성 함수 (미드저니 스타일)
# ============================================
def build_midjourney_prompt(scene: Dict, designer: Dict) -> Dict:
    """미드저니 스타일 [효과] 프롬프트 형식으로 생성"""
    script_text = scene.get("script_text", "")
    keywords = scene.get("keywords", [])
    emotion = scene.get("emotion", "neutral")
    
    keyword_str = ", ".join(keywords) if keywords else ""
    emotion_str = EMOTION_MAP.get(emotion, "neutral mood")
    
    # 미드저니 스타일 프롬프트 구성
    prefix = designer.get("prompt_prefix", "")
    suffix = designer.get("prompt_suffix", "")
    
    # [효과] 내용 형식
    main_content = f"{keyword_str}, {emotion_str}" if keyword_str else emotion_str
    prompt_en = f"{prefix}{main_content}{suffix}"
    
    # 한글 설명 생성
    prompt_ko = f"[{emotion}] {script_text[:80]}..." if len(script_text) > 80 else f"[{emotion}] {script_text}"
    
    return {
        "scene_id": scene.get("scene_id", 0),
        "script_text": script_text,
        "prompt_en": prompt_en.strip(),
        "prompt_ko": prompt_ko,
        "negative_prompt": designer.get("negative_prompt", ""),
        "keywords": keywords,
        "emotion": emotion,
        "status": "ready"
    }

async def translate_ko_to_en_prompt(korean_desc: str, designer: Dict, provider: str = "gemini") -> str:
    """한글 이미지 설명을 영문 프롬프트로 변환 (동기화용)
    
    중요: 반환되는 프롬프트는 반드시 영어로만 작성됨
    """
    system_prompt = f"""You are an expert AI image prompt generator.
Convert Korean image description to English Midjourney-style prompt.
Designer style: {designer.get('name', 'default')}

IMPORTANT RULES:
1. OUTPUT MUST BE IN ENGLISH ONLY - NO KOREAN CHARACTERS
2. Use format: [effects] detailed visual description --style parameters
3. Focus on visual elements: lighting, composition, mood, colors, subjects
4. The description is about what the IMAGE should look like, not the script content

Keep the artistic intent and mood, but translate all concepts to English."""

    user_prompt = f"""Korean image description: "{korean_desc}"

Convert to English-only Midjourney prompt.
RETURN ONLY THE ENGLISH PROMPT, no explanation, no Korean text."""

    try:
        if provider == "gemini" and runtime_settings["api_keys"]["gemini"]:
            import google.generativeai as genai
            genai.configure(api_key=runtime_settings["api_keys"]["gemini"])
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(f"{system_prompt}\n\n{user_prompt}")
            result = response.text.strip()
            # 한글 문자가 포함되어 있으면 제거된 버전 반환
            import re
            if re.search('[가-힣]', result):
                # 한글이 포함되어 있으면 영어만 추출
                result = re.sub('[가-힣]+', '', result).strip()
            return result
            
        elif provider in ["openai", "gpt4o_mini"] and runtime_settings["api_keys"]["openai"]:
            model_name = "gpt-4o-mini" if provider == "gpt4o_mini" else "gpt-4o"
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {runtime_settings['api_keys']['openai']}"},
                    json={
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "max_tokens": 500
                    },
                    timeout=30
                )
                data = response.json()
                result = data["choices"][0]["message"]["content"].strip()
                import re
                if re.search('[가-힣]', result):
                    result = re.sub('[가-힣]+', '', result).strip()
                return result
                
        elif provider == "claude" and runtime_settings["api_keys"]["claude"]:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": runtime_settings["api_keys"]["claude"],
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-sonnet-4-20250514",
                        "max_tokens": 500,
                        "messages": [{"role": "user", "content": f"{system_prompt}\n\n{user_prompt}"}]
                    },
                    timeout=30
                )
                data = response.json()
                result = data["content"][0]["text"].strip()
                import re
                if re.search('[가-힣]', result):
                    result = re.sub('[가-힣]+', '', result).strip()
                return result
    except Exception as e:
        return f"Error: {str(e)}"
    
    # 실패 시 기본 영문 프롬프트 반환
    return "visual scene, professional quality"

async def generate_prompt_with_ai(scene: Dict, designer: Dict, provider: str = "gemini") -> Dict:
    """AI를 사용해 구조화된 태그 형식 프롬프트 생성
    
    출력 형식:
    - PROMPT_EN: 영어로만 작성된 이미지 생성 프롬프트 (한글 불포함)
    - PROMPT_KO: 이미지 내용에 대한 한글 설명 (대본이 아닌 이미지 묘사)
    
    [Style Tag] [Context Tag] Core Description [Visual Details] --parameters
    """
    script_text = scene.get("script_text", "")
    keywords = scene.get("keywords", [])
    emotion = scene.get("emotion", "neutral")
    
    # 디자이너 스타일 정보
    designer_name = designer.get('name', 'default')
    designer_desc = designer.get('description', '')
    designer_category = designer.get('category', 'video')
    
    system_prompt = f"""You are an expert AI image prompt generator specializing in creating VISUAL METAPHORS from script content.

Designer Style: {designer_name}
Description: {designer_desc}
Category: {designer_category}

CRITICAL RULE - VISUAL METAPHOR TRANSFORMATION:
The script text is NOT meant to be literally depicted. You must:
1. Extract the CORE THEME/MESSAGE from the script (economic change, emotional journey, conflict, etc.)
2. Transform that theme into a VISUAL METAPHOR or symbolic imagery
3. Create imagery that REPRESENTS the concept, not illustrates the words literally

EXAMPLE TRANSFORMATIONS:
- Script: "환율이 새로운 뉴노멀이 되어가고 있습니다" (Exchange rates becoming the new normal)
  → Visual: Split screen showing vintage calendar with old rates vs futuristic holographic chart with new rates
- Script: "그냥 여행 갈 때 환전 비용이 좀 더 드는 수준의 문제가 아닙니다" (This is not just about travel exchange costs)
  → Visual: A passport and dollar bills on a table looking insignificant, dwarfed by a looming shadow
- Script: "이건 대한민국 경제의 혈관을 타고 흐르는 피의 압력이 위험 수위까지 치솟았다" (Economic blood pressure rising)
  → Visual: Medical imagery - pressure gauge in red zone, or blood vessels with pulsing pressure

PROMPT STRUCTURE (Mandatory Format):
[Style], [Context: Abstract theme description], [Visuals: Detailed visual metaphor description]

Where:
- [Style]: Overall visual style (e.g., Modern Cinematic, Documentary Style, Artistic)
- [Context: ...]: The ABSTRACT THEME/CONCEPT being conveyed (NOT the literal script content)
- [Visuals: ...]: Detailed description of the VISUAL METAPHOR - objects, composition, lighting, symbolism

IMPORTANT OUTPUT RULES:
1. FULL_PROMPT must be in ENGLISH ONLY - no Korean characters
2. PROMPT_KO describes the VISUAL IMAGE (not the script) - what objects, composition, mood will be shown
3. The image should SYMBOLIZE the script's meaning, not depict its literal words"""

    user_prompt = f"""Korean Script (extract the THEME, don't depict literally): "{script_text}"
Keywords: {', '.join(keywords) if keywords else 'none'}
Emotion/Mood: {emotion}

TASK: Create a VISUAL METAPHOR that represents the script's core message/theme.
DO NOT simply describe or translate the script text.
Instead, think: "What IMAGE would SYMBOLIZE this concept?"

Return in this EXACT format:
STYLE_TAG: [visual style - e.g., Modern Cinematic, Documentary, Artistic]
CONTEXT_TAG: [Context: abstract theme - e.g., "Context: Economic transformation", "Context: Hidden dangers"]
CORE_DESCRIPTION: detailed VISUAL METAPHOR description (objects, composition, symbolism) in ENGLISH ONLY
VISUAL_DETAILS: [Visuals: specific visual elements - lighting, camera angle, mood, composition details]
PROMPT_KO: 이미지의 시각적 구성 설명 (어떤 오브젝트가 보이는지, 구도, 조명, 분위기 - 대본 내용 X)
FULL_PROMPT: [Style], [Context: theme], [Visuals: detailed visual metaphor] - ENGLISH ONLY, no Korean"""

    try:
        import re
        response_text = ""
        
        if provider == "gemini" and runtime_settings["api_keys"]["gemini"]:
            import google.generativeai as genai
            genai.configure(api_key=runtime_settings["api_keys"]["gemini"])
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(f"{system_prompt}\n\n{user_prompt}")
            response_text = response.text.strip()
            
        elif provider in ["openai", "gpt4o_mini"] and runtime_settings["api_keys"]["openai"]:
            model_name = "gpt-4o-mini" if provider == "gpt4o_mini" else "gpt-4o"
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {runtime_settings['api_keys']['openai']}"},
                    json={
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "max_tokens": 800
                    },
                    timeout=30
                )
                data = response.json()
                response_text = data["choices"][0]["message"]["content"].strip()
                
        elif provider == "claude" and runtime_settings["api_keys"]["claude"]:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": runtime_settings["api_keys"]["claude"],
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-sonnet-4-20250514",
                        "max_tokens": 800,
                        "messages": [{"role": "user", "content": f"{system_prompt}\n\n{user_prompt}"}]
                    },
                    timeout=30
                )
                data = response.json()
                response_text = data["content"][0]["text"].strip()
        else:
            return build_midjourney_prompt(scene, designer)
        
        # 응답 파싱
        style_tag = ""
        context_tag = ""
        core_description = ""
        visual_details = ""
        prompt_ko = ""
        full_prompt = ""
        
        for line in response_text.split("\n"):
            line = line.strip()
            if line.startswith("STYLE_TAG:"):
                style_tag = line.replace("STYLE_TAG:", "").strip()
            elif line.startswith("CONTEXT_TAG:"):
                context_tag = line.replace("CONTEXT_TAG:", "").strip()
            elif line.startswith("CORE_DESCRIPTION:"):
                core_description = line.replace("CORE_DESCRIPTION:", "").strip()
            elif line.startswith("VISUAL_DETAILS:"):
                visual_details = line.replace("VISUAL_DETAILS:", "").strip()
            elif line.startswith("PROMPT_KO:"):
                prompt_ko = line.replace("PROMPT_KO:", "").strip()
            elif line.startswith("FULL_PROMPT:"):
                full_prompt = line.replace("FULL_PROMPT:", "").strip()
        
        # 구조화된 프롬프트 조합 (한글이 없는 경우)
        if not full_prompt:
            full_prompt = f"{style_tag} {context_tag} {core_description} {visual_details}".strip()
        
        # 영문 프롬프트에서 한글 제거 (안전장치)
        if re.search('[가-힣]', full_prompt):
            full_prompt = re.sub('[가-힣]+', '', full_prompt).strip()
            # 중복 공백 제거
            full_prompt = re.sub(' +', ' ', full_prompt)
        
        # 디자이너 suffix 추가
        final_prompt = f"{full_prompt} {designer.get('prompt_suffix', '')}".strip()
        
        # 한글 설명이 없으면 기본 설명 생성 (대본이 아닌 이미지 설명)
        if not prompt_ko:
            emotion_ko = {
                "neutral": "차분한",
                "curious": "호기심 가득한",
                "happy": "밝고 즐거운",
                "sad": "감성적인",
                "excited": "역동적인",
                "serious": "진지한",
                "warm": "따뜻한",
                "dramatic": "드라마틱한"
            }.get(emotion, "자연스러운")
            prompt_ko = f"{emotion_ko} 분위기의 이미지. 시각적 장면 묘사."
        
        return {
            "scene_id": scene.get("scene_id", 0),
            "script_text": script_text,
            "prompt_en": final_prompt,
            "prompt_ko": prompt_ko,
            "structured": {
                "style_tag": style_tag,
                "context_tag": context_tag,
                "core_description": core_description,
                "visual_details": visual_details
            },
            "negative_prompt": designer.get("negative_prompt", ""),
            "keywords": keywords,
            "emotion": emotion,
            "designer_id": designer.get("id", ""),
            "status": "ready"
        }
        
    except Exception as e:
        result = build_midjourney_prompt(scene, designer)
        result["error"] = str(e)
        return result

async def recommend_designer(description: str, scenes: List[Dict] = None, provider: str = "gemini") -> Dict:
    """대본 내용을 분석하여 가장 적합한 디자이너 추천"""
    all_designers = get_all_designers()
    
    # 카테고리별로 디자이너 정리
    designer_list = ""
    for group_id, group_info in CATEGORY_GROUPS.items():
        designer_list += f"\n## {group_info['name']} ({group_info['description']}):\n"
        for d_id, d_info in all_designers.items():
            if d_info.get("category", "") in group_info["categories"]:
                best_for = ", ".join(d_info.get("best_for", []))
                designer_list += f"- {d_id}: {d_info['name']} - {d_info['description']} (적합: {best_for})\n"
    
    # 대본 내용 추출
    script_content = ""
    if scenes:
        script_texts = [s.get("script_text", "") for s in scenes if s.get("script_text")]
        script_content = "\n".join(script_texts[:5])  # 처음 5개 장면만
    
    system_prompt = f"""You are an expert AI that analyzes video scripts and recommends the best visual style/designer.

Available Designer Styles (organized by category):
{designer_list}

Your task:
1. Analyze the script/description content
2. Identify the tone, genre, target audience, and visual requirements
3. Recommend the most suitable designer style
4. Explain WHY this style fits the content"""

    # 스크립트 포함 여부에 따라 다른 프롬프트
    if script_content:
        user_prompt = f"""Analyze this Korean script content and recommend the best designer style:

=== SCRIPT CONTENT ===
{script_content}
======================

User additional notes: "{description}"

Based on the script's tone, content type, and visual requirements, recommend the best designer.

Return in this EXACT format:
RECOMMENDED: [designer_id]
REASON_KO: [한글로 추천 이유 설명 - 왜 이 스타일이 대본에 적합한지]
REASON_EN: [English explanation]
ALTERNATIVES: [comma separated alternative designer_ids]
ANALYSIS: [Brief analysis of the script - tone, genre, target audience]"""
    else:
        user_prompt = f"""User description: "{description}"

Recommend the best designer for this description.

Return in this EXACT format:
RECOMMENDED: [designer_id]
REASON_KO: [한글로 추천 이유 설명]
REASON_EN: [English explanation]
ALTERNATIVES: [comma separated alternative designer_ids]"""

    try:
        response_text = ""
        
        if provider == "gemini" and runtime_settings["api_keys"]["gemini"]:
            import google.generativeai as genai
            genai.configure(api_key=runtime_settings["api_keys"]["gemini"])
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(f"{system_prompt}\n\n{user_prompt}")
            response_text = response.text.strip()
            
        elif provider in ["openai", "gpt4o_mini"] and runtime_settings["api_keys"]["openai"]:
            model_name = "gpt-4o-mini" if provider == "gpt4o_mini" else "gpt-4o"
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {runtime_settings['api_keys']['openai']}"},
                    json={
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "max_tokens": 500
                    },
                    timeout=30
                )
                data = response.json()
                response_text = data["choices"][0]["message"]["content"].strip()
        
        # 파싱
        recommended = "bright_cheerful"
        reason_ko = ""
        reason_en = ""
        alternatives = []
        analysis = ""
        
        for line in response_text.split("\n"):
            if line.startswith("RECOMMENDED:"):
                recommended = line.replace("RECOMMENDED:", "").strip()
            elif line.startswith("REASON_KO:"):
                reason_ko = line.replace("REASON_KO:", "").strip()
            elif line.startswith("REASON_EN:"):
                reason_en = line.replace("REASON_EN:", "").strip()
            elif line.startswith("REASON:"):
                reason_ko = line.replace("REASON:", "").strip()
            elif line.startswith("ALTERNATIVES:"):
                alts = line.replace("ALTERNATIVES:", "").strip()
                alternatives = [a.strip() for a in alts.split(",")]
            elif line.startswith("ANALYSIS:"):
                analysis = line.replace("ANALYSIS:", "").strip()
        
        # 디자이너 검증
        if recommended not in all_designers:
            recommended = "bright_cheerful"
        
        return {
            "success": True,
            "recommended": recommended,
            "recommended_designer": all_designers.get(recommended, all_designers.get("bright_cheerful")),
            "reason": reason_ko or reason_en,
            "reason_ko": reason_ko,
            "reason_en": reason_en,
            "analysis": analysis,
            "alternatives": [a for a in alternatives[:3] if a in all_designers],
            "script_analyzed": bool(script_content)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "recommended": "bright_cheerful",
            "recommended_designer": PRESET_DESIGNERS["bright_cheerful"]
        }

# ============================================
# 썸네일 프롬프트 생성 함수
# ============================================
async def generate_thumbnail_prompts(full_script: str, title: str = "", provider: str = "gemini") -> Dict:
    """전체 대본을 분석하여 썸네일용 프롬프트 3개 생성

    썸네일 특징:
    - 영상의 핵심 메시지를 한 장의 이미지로 표현
    - 한글 텍스트 문구 포함 (제목, 키워드 등)
    - 시선을 끄는 강렬한 구도와 색상
    - 장면 프롬프트처럼 세부적인 시각적 은유 형식 사용
    """

    system_prompt = """You are an expert YouTube thumbnail designer specializing in creating VISUAL METAPHORS from script content.

CRITICAL RULE - VISUAL METAPHOR TRANSFORMATION:
The script text is NOT meant to be literally depicted. You must:
1. Extract the CORE THEME/MESSAGE from the entire script
2. Transform that theme into a POWERFUL VISUAL METAPHOR
3. Create imagery that REPRESENTS the concept symbolically
4. Design for maximum click appeal and curiosity

THUMBNAIL DESIGN PRINCIPLES:
1. ONE powerful visual metaphor that captures the video's essence
2. Bold, contrasting colors for visual impact (specify exact colors)
3. Clear focal point with dramatic composition
4. Space for Korean text overlay (title, keywords)
5. Emotional appeal - curiosity, shock, excitement, or urgency
6. Cinematic quality with professional lighting

PROMPT STRUCTURE (Mandatory Format for FULL_PROMPT):
[Modern Cinematic], [Context: Abstract theme description], [Visuals: Detailed visual metaphor with specific objects, lighting, composition, camera angle, mood]

KOREAN DESCRIPTION (PROMPT_KO) GUIDELINES:
- Must be in Korean describing the VISUAL IMAGE (not the script content)
- Describe what objects, composition, lighting, mood will be shown
- Example: "금이 간 지구본 위에 떨어지는 달러 지폐들, 붉은 경고등 조명, 긴박한 분위기"

OUTPUT FORMAT for each thumbnail:
THUMBNAIL_1:
KOREAN_TEXT: [한글 텍스트 오버레이 - 2-4단어 임팩트 있는 문구 (예: "충격 진실", "지금 당장")]
PROMPT_KO: [시각적 이미지 한글 설명 - 어떤 오브젝트, 구도, 조명, 분위기가 보이는지 구체적으로]
FULL_PROMPT: [Modern Cinematic], [Context: theme], [Visuals: detailed description with lighting, camera angle, colors, objects, mood] - ENGLISH ONLY

Generate 3 distinctly different thumbnail concepts with varied visual metaphors."""

    user_prompt = f"""Analyze this Korean script and create 3 VISUALLY STUNNING thumbnail concepts:

TITLE: {title or '(제목 없음)'}

FULL SCRIPT:
{full_script[:3000]}

TASK: Create 3 thumbnail prompts that:
1. Each captures a DIFFERENT aspect or angle of the content using VISUAL METAPHORS
2. Each has unique Korean text overlay (KOREAN_TEXT) for impact
3. Each has Korean visual description (PROMPT_KO) describing the image composition
4. Would make viewers IMMEDIATELY want to click
5. Uses the structured format: [Style], [Context: theme], [Visuals: detailed description]

Return in this EXACT format for each:
THUMBNAIL_1:
KOREAN_TEXT: [임팩트 있는 한글 문구 2-4단어]
PROMPT_KO: [이미지의 시각적 구성을 한글로 설명 - 오브젝트, 구도, 조명, 분위기]
FULL_PROMPT: [Modern Cinematic], [Context: abstract theme], [Visuals: detailed visual metaphor with lighting, camera angle, specific objects, colors, mood]

THUMBNAIL_2:
KOREAN_TEXT: ...
PROMPT_KO: ...
FULL_PROMPT: ...

THUMBNAIL_3:
KOREAN_TEXT: ...
PROMPT_KO: ...
FULL_PROMPT: ..."""

    try:
        response_text = ""

        if provider == "gemini" and runtime_settings["api_keys"]["gemini"]:
            import google.generativeai as genai
            genai.configure(api_key=runtime_settings["api_keys"]["gemini"])
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(f"{system_prompt}\n\n{user_prompt}")
            response_text = response.text.strip()

        elif provider in ["openai", "gpt4o_mini"] and runtime_settings["api_keys"]["openai"]:
            model_name = "gpt-4o-mini" if provider == "gpt4o_mini" else "gpt-4o"
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {runtime_settings['api_keys']['openai']}"},
                    json={
                        "model": model_name,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        "max_tokens": 2000
                    },
                    timeout=60
                )
                data = response.json()
                response_text = data["choices"][0]["message"]["content"].strip()

        elif provider == "claude" and runtime_settings["api_keys"]["claude"]:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": runtime_settings["api_keys"]["claude"],
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-sonnet-4-20250514",
                        "max_tokens": 2000,
                        "messages": [{"role": "user", "content": f"{system_prompt}\n\n{user_prompt}"}]
                    },
                    timeout=60
                )
                data = response.json()
                response_text = data["content"][0]["text"].strip()
        else:
            return {"success": False, "error": "AI 프로바이더가 설정되지 않았습니다."}

        # 응답 파싱
        thumbnails = []
        current_thumbnail = {}

        for line in response_text.split("\n"):
            line = line.strip()

            if line.startswith("THUMBNAIL_"):
                if current_thumbnail:
                    thumbnails.append(current_thumbnail)
                current_thumbnail = {"id": len(thumbnails) + 1}
            elif line.startswith("KOREAN_TEXT:"):
                current_thumbnail["korean_text"] = line.replace("KOREAN_TEXT:", "").strip()
            elif line.startswith("PROMPT_KO:"):
                current_thumbnail["prompt_ko"] = line.replace("PROMPT_KO:", "").strip()
            elif line.startswith("VISUAL_CONCEPT:"):
                # 레거시 지원 - prompt_ko가 없으면 visual_concept 사용
                if "prompt_ko" not in current_thumbnail:
                    current_thumbnail["prompt_ko"] = line.replace("VISUAL_CONCEPT:", "").strip()
            elif line.startswith("FULL_PROMPT:"):
                current_thumbnail["prompt_en"] = line.replace("FULL_PROMPT:", "").strip()

        # 마지막 썸네일 추가
        if current_thumbnail:
            thumbnails.append(current_thumbnail)

        # 최소 3개 보장 및 prompt_ko 기본값 설정
        while len(thumbnails) < 3:
            thumbnails.append({
                "id": len(thumbnails) + 1,
                "korean_text": "클릭 필수!",
                "prompt_ko": "강렬한 색상의 시선을 끄는 썸네일 이미지, 중앙 포커스 구도",
                "prompt_en": "[Modern Cinematic], [Context: Attention-grabbing visual], [Visuals: Bold contrasting colors, dramatic lighting, centered focal point, professional YouTube thumbnail composition, 16:9 aspect ratio]"
            })

        # prompt_ko가 없는 썸네일에 기본값 설정
        for thumb in thumbnails:
            if "prompt_ko" not in thumb or not thumb["prompt_ko"]:
                thumb["prompt_ko"] = thumb.get("korean_text", "썸네일 이미지")

        return {
            "success": True,
            "thumbnails": thumbnails[:3],
            "title": title,
            "script_preview": full_script[:200] + "..." if len(full_script) > 200 else full_script
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "thumbnails": []
        }

# ============================================
# 이미지 생성 함수
# ============================================
async def generate_image_dalle3(prompt: str, negative_prompt: str, size: str) -> Dict:
    """DALL-E 3로 이미지 생성"""
    api_key = runtime_settings["api_keys"]["openai"]
    if not api_key:
        return {"success": False, "error": "OpenAI API 키가 설정되지 않았습니다."}
    
    full_prompt = f"{prompt}. Avoid: {negative_prompt}" if negative_prompt else prompt
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": "dall-e-3",
                    "prompt": full_prompt,
                    "size": size,
                    "quality": "hd",
                    "n": 1
                },
                timeout=60
            )
            data = response.json()
            
            if "data" in data and len(data["data"]) > 0:
                return {
                    "success": True,
                    "image_url": data["data"][0]["url"],
                    "provider": "dalle3",
                    "revised_prompt": data["data"][0].get("revised_prompt", "")
                }
            return {"success": False, "error": data.get("error", {}).get("message", "Unknown error")}
                
    except Exception as e:
        return {"success": False, "error": str(e)}

async def generate_image_replicate(prompt: str, negative_prompt: str, aspect_ratio: str, model: str = "flux-schnell") -> Dict:
    """Replicate로 이미지 생성 (다양한 모델 지원)

    지원 모델:
    - flux-schnell: black-forest-labs/flux-schnell (기본, 빠른 생성)
    - seedream-4: bytedance/seedream-4 (ByteDance의 고품질 모델)
    - nano-banana: google/nano-banana (Google의 경량 모델)
    - nano-banana-pro: google/nano-banana-pro (Google의 고품질 모델)
    """
    api_key = runtime_settings["api_keys"]["replicate"]
    if not api_key:
        return {"success": False, "error": "Replicate API 키가 설정되지 않았습니다."}

    try:
        import replicate
        os.environ["REPLICATE_API_TOKEN"] = api_key

        # 모델별 설정
        model_configs = {
            "flux-schnell": {
                "model_id": "black-forest-labs/flux-schnell",
                "input": {
                    "prompt": prompt,
                    "aspect_ratio": aspect_ratio,
                    "output_format": "webp",
                    "output_quality": 80
                }
            },
            "seedream-4": {
                "model_id": "bytedance/seedream-4",
                "input": {
                    "prompt": prompt,
                    "negative_prompt": negative_prompt or "",
                    "aspect_ratio": aspect_ratio,
                    "num_outputs": 1
                }
            },
            "nano-banana": {
                "model_id": "google/nano-banana",
                "input": {
                    "prompt": prompt,
                    "negative_prompt": negative_prompt or "",
                    "aspect_ratio": aspect_ratio,
                    "num_outputs": 1
                }
            },
            "nano-banana-pro": {
                "model_id": "google/nano-banana-pro",
                "input": {
                    "prompt": prompt,
                    "negative_prompt": negative_prompt or "",
                    "aspect_ratio": aspect_ratio,
                    "num_outputs": 1
                }
            }
        }

        # 모델 설정 가져오기 (기본값: flux-schnell)
        config = model_configs.get(model, model_configs["flux-schnell"])

        output = replicate.run(
            config["model_id"],
            input=config["input"]
        )

        if output:
            image_url = str(output[0]) if isinstance(output, list) else str(output)
            return {"success": True, "image_url": image_url, "provider": "replicate", "model": model}
        return {"success": False, "error": "이미지 생성 실패"}

    except Exception as e:
        return {"success": False, "error": str(e)}

async def generate_image_vertex(prompt: str, negative_prompt: str, size: str, model: str = "auto") -> Dict:
    """Google Vertex AI / Nano Banana로 이미지 생성

    지원 모델:
    - auto: 자동 선택 (imagen-4.0-fast-generate-001 우선)
    - nano-banana: imagen-3.0-generate-002 (Nano Banana)
    - imagen-4-fast: imagen-4.0-fast-generate-001
    - imagen-4-ultra: imagen-4.0-ultra-generate-001
    - gemini-image: gemini-2.0-flash-exp-image-generation

    새로운 google-genai SDK 사용
    """
    api_key = runtime_settings["api_keys"]["vertex"] or runtime_settings["api_keys"]["gemini"]
    if not api_key:
        return {"success": False, "error": "Vertex AI API 키가 설정되지 않았습니다."}

    try:
        from google import genai
        from google.genai import types
        import base64
        import io

        # 클라이언트 초기화
        client = genai.Client(api_key=api_key)

        # 비율 설정
        aspect_ratio = "16:9" if "1792" in size else "1:1" if "1024x1024" in size else "9:16"

        # 모델 매핑 (실제 Google AI에서 사용 가능한 모델명)
        # Nano Banana는 Imagen 4.0 Fast의 코드명으로 추정
        model_map = {
            "nano-banana": "imagen-4.0-fast-generate-001",     # Nano Banana = Imagen 4.0 Fast
            "nano-banana-pro": "imagen-4.0-ultra-generate-001", # Nano Banana Pro = Imagen 4.0 Ultra
            "imagen-4-fast": "imagen-4.0-fast-generate-001",
            "imagen-4-ultra": "imagen-4.0-ultra-generate-001",
            "gemini-image": "gemini-2.0-flash-exp-image-generation"
        }

        # 모델 선택
        if model != "auto" and model in model_map:
            # 특정 모델 지정된 경우 해당 모델만 시도
            imagen_models = [model_map[model]]
        else:
            # auto 모드: 순차적으로 시도
            imagen_models = [
                "imagen-4.0-fast-generate-001",      # Imagen 4.0 Fast (빠른 생성)
                "imagen-3.0-generate-001",           # Imagen 3.0 (Nano Banana)
                "imagen-4.0-ultra-generate-001",     # Imagen 4.0 Ultra (고품질)
                "gemini-2.0-flash-exp-image-generation",  # Gemini 이미지 생성
            ]
        
        last_error = None
        
        for model_name in imagen_models:
            try:
                result = client.models.generate_images(
                    model=model_name,
                    prompt=prompt,
                    config=types.GenerateImagesConfig(
                        number_of_images=1,
                        aspect_ratio=aspect_ratio,
                    )
                )
                
                if result.generated_images and len(result.generated_images) > 0:
                    # 첫 번째 이미지 가져오기
                    image = result.generated_images[0]
                    
                    # 이미지 데이터를 base64로 인코딩
                    if hasattr(image, 'image') and hasattr(image.image, 'image_bytes'):
                        img_bytes = image.image.image_bytes
                    elif hasattr(image, 'image_bytes'):
                        img_bytes = image.image_bytes
                    else:
                        # PIL 이미지로 변환 시도
                        from PIL import Image
                        if hasattr(image, 'image'):
                            pil_image = image.image._pil_image if hasattr(image.image, '_pil_image') else image.image
                        else:
                            pil_image = image._pil_image if hasattr(image, '_pil_image') else image
                        
                        buffer = io.BytesIO()
                        pil_image.save(buffer, format="PNG")
                        img_bytes = buffer.getvalue()
                    
                    img_str = base64.b64encode(img_bytes).decode()
                    
                    return {
                        "success": True,
                        "image_url": f"data:image/png;base64,{img_str}",
                        "provider": "vertex",
                        "model": model_name
                    }
                    
            except Exception as model_error:
                last_error = str(model_error)
                # 모델이 지원되지 않으면 다음 모델 시도
                if "not found" in last_error.lower() or "not supported" in last_error.lower():
                    continue
                # 다른 에러도 다음 모델로 시도
                continue
        
        # 모든 모델 실패 시
        return {"success": False, "error": f"이미지 생성 실패: {last_error}"}
        
    except ImportError:
        return {"success": False, "error": "google-genai 패키지가 설치되지 않았습니다. 'pip install google-genai' 명령으로 설치하세요."}
    except Exception as e:
        error_msg = str(e)
        if "permission" in error_msg.lower() or "403" in error_msg:
            return {"success": False, "error": "API 접근 권한이 없습니다. API 키를 확인하세요."}
        if "quota" in error_msg.lower() or "429" in error_msg:
            return {"success": False, "error": "API 할당량 초과. 잠시 후 다시 시도하세요."}
        if "billing" in error_msg.lower():
            return {"success": False, "error": "결제 설정이 필요합니다. Google Cloud 결제를 활성화하세요."}
        return {"success": False, "error": error_msg}

async def generate_image(prompt: str, negative_prompt: str = "", provider: str = "dalle3", size: str = "1792x1024", model: str = None) -> Dict:
    """통합 이미지 생성 함수

    지원 provider와 모델:
    - dalle3: OpenAI DALL-E 3
    - replicate: Replicate (flux-schnell, seedream-4, nano-banana, nano-banana-pro)
    - vertex: Vertex AI (nano-banana, imagen-4-fast, imagen-4-ultra, gemini-image)
    - vertex-nano-banana: Vertex AI Nano Banana 직접 호출
    - replicate-seedream: Replicate SeeDream-4 직접 호출
    - replicate-nano-banana: Replicate Nano Banana 직접 호출
    - replicate-nano-banana-pro: Replicate Nano Banana Pro 직접 호출
    """
    aspect_map = {"1792x1024": "16:9", "1024x1792": "9:16", "1024x1024": "1:1"}
    aspect_ratio = aspect_map.get(size, "16:9")

    if provider == "dalle3":
        return await generate_image_dalle3(prompt, negative_prompt, size)
    elif provider == "replicate":
        return await generate_image_replicate(prompt, negative_prompt, aspect_ratio, model or "flux-schnell")
    elif provider == "replicate-seedream":
        return await generate_image_replicate(prompt, negative_prompt, aspect_ratio, "seedream-4")
    elif provider == "replicate-nano-banana":
        return await generate_image_replicate(prompt, negative_prompt, aspect_ratio, "nano-banana")
    elif provider == "replicate-nano-banana-pro":
        return await generate_image_replicate(prompt, negative_prompt, aspect_ratio, "nano-banana-pro")
    elif provider == "vertex":
        return await generate_image_vertex(prompt, negative_prompt, size, model or "auto")
    elif provider == "vertex-nano-banana":
        return await generate_image_vertex(prompt, negative_prompt, size, "nano-banana")
    elif provider == "vertex-nano-banana-pro":
        return await generate_image_vertex(prompt, negative_prompt, size, "nano-banana-pro")
    else:
        return {"success": False, "error": f"Unknown provider: {provider}"}

# ============================================
# API Endpoints - 설정
# ============================================
@app.get("/health")
async def health_check():
    return {"status": "healthy", "module": "image-generator", "version": "2.6.0"}

@app.post("/api/settings/test-api-key")
async def test_api_key(data: ApiKeyTest):
    provider = data.provider
    api_key = data.api_key
    
    try:
        if provider == "openai":
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"},
                    timeout=10
                )
                if response.status_code == 200:
                    return {"success": True, "message": "OpenAI API 연결 성공"}
                return {"success": False, "error": "인증 실패"}
                
        elif provider == "replicate":
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.replicate.com/v1/account",
                    headers={"Authorization": f"Token {api_key}"},
                    timeout=10
                )
                if response.status_code == 200:
                    return {"success": True, "message": "Replicate API 연결 성공"}
                return {"success": False, "error": "인증 실패"}
                
        elif provider == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content("Say 'OK'")
            if response.text:
                return {"success": True, "message": "Gemini API 연결 성공"}
            return {"success": False, "error": "응답 없음"}
            
        elif provider == "claude":
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-sonnet-4-20250514",
                        "max_tokens": 10,
                        "messages": [{"role": "user", "content": "Say OK"}]
                    },
                    timeout=10
                )
                if response.status_code == 200:
                    return {"success": True, "message": "Claude API 연결 성공"}
                return {"success": False, "error": "인증 실패"}
                
        elif provider == "vertex":
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            # Vertex AI 키 검증
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content("Say 'OK'")
            if response.text:
                return {"success": True, "message": "Vertex AI 연결 성공 (Gemini 검증)"}
            return {"success": False, "error": "응답 없음"}
        else:
            return {"success": False, "error": f"Unknown provider: {provider}"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/settings/save")
async def save_api_keys(data: Dict):
    for provider, key in data.items():
        if provider in runtime_settings["api_keys"]:
            runtime_settings["api_keys"][provider] = key
    
    secrets_path = BASE_DIR / "api_secrets.json"
    secrets = {}
    if secrets_path.exists():
        with open(secrets_path, 'r', encoding='utf-8') as f:
            secrets = json.load(f)
    
    key_map = {
        "openai": "openai_api_key",
        "replicate": "replicate_api_token",
        "gemini": "gemini_api_key",
        "claude": "claude_api_key",
        "vertex": "vertex_api_key"
    }
    
    for provider, key in data.items():
        if provider in key_map and key:
            secrets[key_map[provider]] = key
    
    with open(secrets_path, 'w', encoding='utf-8') as f:
        json.dump(secrets, f, indent=2, ensure_ascii=False)
    
    return {"success": True, "message": "API 키 저장 완료"}

@app.get("/api/settings")
async def get_settings():
    masked = {}
    for provider, key in runtime_settings["api_keys"].items():
        if key:
            masked[provider] = {"configured": True, "masked": key[:8] + "..." + key[-4:] if len(key) > 12 else "***"}
        else:
            masked[provider] = {"configured": False, "masked": None}
    return {"api_keys": masked, "default_provider": runtime_settings["default_provider"]}

# API Endpoints - 디자이너
# ============================================
@app.get("/api/designers")
async def list_designers():
    all_designers = get_all_designers()
    favorites = get_favorites()
    
    # 카테고리별 분류
    categorized = {}
    for group_id, group_info in CATEGORY_GROUPS.items():
        categorized[group_id] = {
            "name": group_info["name"],
            "description": group_info["description"],
            "designers": {}
        }
    
    # 각 디자이너를 카테고리 그룹에 배치
    presets = {}
    custom = {}
    for k, v in all_designers.items():
        # 즐겨찾기 여부 추가
        v["is_favorite"] = k in favorites
        
        if v.get("is_preset", False):
            presets[k] = v
        else:
            custom[k] = v
        
        # 카테고리 그룹에 할당
        designer_category = v.get("category", "video")
        assigned = False
        for group_id, group_info in CATEGORY_GROUPS.items():
            if designer_category in group_info["categories"]:
                categorized[group_id]["designers"][k] = v
                assigned = True
                break
        
        # 할당 안된 경우 special에 추가
        if not assigned:
            categorized["special"]["designers"][k] = v
    
    return {
        "presets": presets, 
        "custom": custom, 
        "categorized": categorized,
        "category_groups": CATEGORY_GROUPS,
        "favorites": favorites,
        "total": len(all_designers)
    }

@app.get("/api/designers/favorites")
async def get_favorite_designers():
    """즐겨찾기 디자이너 목록"""
    favorites = get_favorites()
    all_designers = get_all_designers()
    favorite_designers = {k: v for k, v in all_designers.items() if k in favorites}
    return {"favorites": favorites, "designers": favorite_designers}

@app.post("/api/designers/{designer_id}/favorite")
async def toggle_favorite(designer_id: str):
    """즐겨찾기 토글"""
    favorites = get_favorites()
    if designer_id in favorites:
        remove_favorite(designer_id)
        return {"success": True, "is_favorite": False, "message": "즐겨찾기에서 제거됨"}
    else:
        add_favorite(designer_id)
        return {"success": True, "is_favorite": True, "message": "즐겨찾기에 추가됨"}

@app.get("/api/designers/{designer_id}")
async def get_designer_detail(designer_id: str):
    designer = get_designer(designer_id)
    if not designer:
        raise HTTPException(status_code=404, detail="디자이너를 찾을 수 없습니다.")
    return designer

@app.post("/api/designers")
async def create_designer(data: CustomDesigner):
    custom = get_custom_designers()
    designer_id = f"custom_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    new_designer = {
        "id": designer_id,
        "name": data.name,
        "description": data.description,
        "category": data.category,
        "is_preset": False,
        "prompt_prefix": data.prompt_prefix,
        "prompt_suffix": data.prompt_suffix,
        "negative_prompt": data.negative_prompt,
        "best_for": data.best_for,
        "created_at": datetime.now().isoformat()
    }
    
    custom[designer_id] = new_designer
    save_custom_designers(custom)
    
    return {"success": True, "designer": new_designer}

@app.put("/api/designers/{designer_id}")
async def update_designer(designer_id: str, data: CustomDesigner):
    if designer_id in PRESET_DESIGNERS:
        raise HTTPException(status_code=400, detail="프리셋 디자이너는 수정할 수 없습니다.")
    
    custom = get_custom_designers()
    if designer_id not in custom:
        raise HTTPException(status_code=404, detail="디자이너를 찾을 수 없습니다.")
    
    custom[designer_id].update({
        "name": data.name,
        "description": data.description,
        "category": data.category,
        "prompt_prefix": data.prompt_prefix,
        "prompt_suffix": data.prompt_suffix,
        "negative_prompt": data.negative_prompt,
        "best_for": data.best_for,
        "updated_at": datetime.now().isoformat()
    })
    
    save_custom_designers(custom)
    return {"success": True, "designer": custom[designer_id]}

@app.delete("/api/designers/{designer_id}")
async def delete_designer(designer_id: str):
    if designer_id in PRESET_DESIGNERS:
        raise HTTPException(status_code=400, detail="프리셋 디자이너는 삭제할 수 없습니다.")
    
    custom = get_custom_designers()
    if designer_id not in custom:
        raise HTTPException(status_code=404, detail="디자이너를 찾을 수 없습니다.")
    
    del custom[designer_id]
    save_custom_designers(custom)
    return {"success": True, "message": "삭제 완료"}

@app.post("/api/designers/recommend")
async def api_recommend_designer(data: RecommendDesignerRequest):
    """대본을 분석하여 디자이너 추천"""
    result = await recommend_designer(data.description, data.scenes, data.ai_provider)
    return result

# ============================================
# API Endpoints - 프롬프트
# ============================================
@app.post("/api/prompts/generate")
async def generate_prompts(data: PromptGenerateRequest):
    designer = get_designer(data.designer_id) or PRESET_DESIGNERS["bright_cheerful"]
    
    results = []
    for scene in data.scenes:
        prompt_data = build_midjourney_prompt(scene, designer)
        results.append(prompt_data)
    
    return {"success": True, "prompts": results, "designer_used": designer["name"]}

@app.post("/api/prompts/generate-ai")
async def generate_prompts_ai(data: Dict):
    scenes = data.get("scenes", [])
    designer_id = data.get("designer_id", "bright_cheerful")
    ai_provider = data.get("ai_provider", "gemini")
    
    designer = get_designer(designer_id) or PRESET_DESIGNERS["bright_cheerful"]
    
    results = []
    for scene in scenes:
        prompt_data = await generate_prompt_with_ai(scene, designer, ai_provider)
        results.append(prompt_data)
    
    return {"success": True, "prompts": results, "designer_used": designer["name"], "ai_provider": ai_provider}

@app.post("/api/prompts/sync-ko-to-en")
async def sync_korean_to_english(data: KoToEnRequest):
    """한글 대본 → 시각적 은유 프롬프트 생성 (영문 + 한글 이미지 설명)"""
    designer = get_designer(data.designer_id) or PRESET_DESIGNERS["bright_cheerful"]

    # korean_text 또는 korean_description 중 하나 사용
    korean_input = data.korean_text or data.korean_description
    if not korean_input:
        return {"success": False, "error": "한글 설명을 입력하세요"}

    # generate_prompt_with_ai를 사용하여 시각적 은유로 변환
    scene = {
        "scene_id": 0,
        "script_text": korean_input,
        "keywords": [],
        "emotion": "neutral"
    }

    result = await generate_prompt_with_ai(scene, designer, data.ai_provider)

    return {
        "success": True,
        "prompt_en": result.get("prompt_en", ""),
        "prompt_ko": result.get("prompt_ko", ""),  # 시각적 은유로 변환된 한글 설명
        "negative_prompt": result.get("negative_prompt", designer.get("negative_prompt", "")),
        "structured": result.get("structured", {})
    }

class ThumbnailRequest(BaseModel):
    full_script: str
    title: Optional[str] = ""
    ai_provider: Optional[str] = "gemini"

@app.post("/api/thumbnails/generate")
async def generate_thumbnails(data: ThumbnailRequest):
    """전체 대본을 분석하여 썸네일 프롬프트 3개 생성"""
    result = await generate_thumbnail_prompts(
        full_script=data.full_script,
        title=data.title,
        provider=data.ai_provider
    )
    return result

class ThumbnailImageRequest(BaseModel):
    prompt_en: str
    korean_text: Optional[str] = ""
    provider: Optional[str] = "vertex"
    size: Optional[str] = "1792x1024"
    negative_prompt: Optional[str] = ""

@app.post("/api/thumbnails/generate-image")
async def generate_thumbnail_image(data: ThumbnailImageRequest):
    """썸네일 이미지 생성"""
    # 한글 텍스트가 있으면 프롬프트에 추가
    prompt = data.prompt_en
    if data.korean_text:
        prompt = f"{prompt}. Include bold Korean text overlay: '{data.korean_text}' in eye-catching typography"

    result = await generate_image(
        prompt=prompt,
        negative_prompt=data.negative_prompt,
        provider=data.provider,
        size=data.size
    )

    if result.get("success"):
        result["korean_text"] = data.korean_text

    return result

# ============================================
# API Endpoints - M-06 연동
# ============================================
@app.post("/api/import/m06-scenes")
async def import_m06_scenes(data: M06SceneImport):
    return {
        "success": True,
        "project_id": data.project_id,
        "title": data.title,
        "scenes": data.scenes,
        "total_scenes": len(data.scenes),
        "thumbnail_suggestions": data.thumbnail_suggestions
    }

# ============================================
# API Endpoints - 이미지 생성
# ============================================
class ImageGenerateRequestV2(BaseModel):
    prompt: Optional[str] = None  # 프론트엔드 호환용
    prompt_en: Optional[str] = None
    negative_prompt: Optional[str] = ""
    provider: str = "dalle3"
    size: str = "1792x1024"
    resolution: Optional[str] = "2k"  # 해상도 옵션

@app.post("/api/images/generate")
async def api_generate_image(data: ImageGenerateRequestV2):
    # prompt 또는 prompt_en 중 하나 사용
    prompt_text = data.prompt or data.prompt_en
    if not prompt_text:
        return {"success": False, "error": "프롬프트가 필요합니다."}
    
    result = await generate_image(
        prompt=prompt_text,
        negative_prompt=data.negative_prompt or "",
        provider=data.provider,
        size=data.size
    )
    return result

@app.post("/api/images/generate-batch")
async def api_generate_batch(data: BatchGenerateRequest):
    results = []
    for prompt_data in data.prompts:
        result = await generate_image(
            prompt=prompt_data.get("prompt_en", ""),
            negative_prompt=prompt_data.get("negative_prompt", ""),
            provider=data.provider,
            size=prompt_data.get("size", "1792x1024")
        )
        result["scene_id"] = prompt_data.get("scene_id", 0)
        results.append(result)
    
    success_count = sum(1 for r in results if r.get("success"))
    return {
        "success": True,
        "results": results,
        "total": len(data.prompts),
        "success_count": success_count
    }

# ============================================
# n8n Webhook
# ============================================
@app.post("/webhook/image/generate")
async def webhook_generate(data: Dict):
    scenes = data.get("scenes", [])
    designer_id = data.get("designer_id", "bright_cheerful")
    provider = data.get("provider", "dalle3")
    size = data.get("size", "1792x1024")
    
    designer = get_designer(designer_id) or PRESET_DESIGNERS["bright_cheerful"]
    
    results = []
    for scene in scenes:
        prompt_data = build_midjourney_prompt(scene, designer)
        image_result = await generate_image(
            prompt=prompt_data["prompt_en"],
            negative_prompt=prompt_data["negative_prompt"],
            provider=provider,
            size=size
        )
        
        results.append({
            "scene_id": scene.get("scene_id"),
            "prompt": prompt_data["prompt_en"],
            "image_url": image_result.get("image_url"),
            "success": image_result.get("success", False),
            "error": image_result.get("error")
        })
    
    return {
        "success": True,
        "results": results,
        "total": len(scenes),
        "success_count": sum(1 for r in results if r.get("success"))
    }

@app.get("/api/options")
async def get_options():
    return {
        "providers": [
            {"id": "dalle3", "name": "DALL-E 3", "description": "OpenAI - 고품질"},
            {"id": "replicate", "name": "Replicate Flux", "description": "빠르고 저렴"},
            {"id": "replicate-seedream", "name": "SeeDream-4", "description": "ByteDance - 고품질"},
            {"id": "replicate-nano-banana", "name": "Nano Banana (Replicate)", "description": "Google 경량 모델"},
            {"id": "replicate-nano-banana-pro", "name": "Nano Banana Pro (Replicate)", "description": "Google 고품질 모델"},
            {"id": "vertex", "name": "Vertex AI Imagen", "description": "Google Cloud - 자동 선택"},
            {"id": "vertex-nano-banana", "name": "Nano Banana (Vertex)", "description": "Google Imagen 4.0 Fast"},
            {"id": "vertex-nano-banana-pro", "name": "Nano Banana Pro (Vertex)", "description": "Google Imagen 4.0 Ultra"}
        ],
        "prompt_ai": [
            {"id": "none", "name": "사용 안함"},
            {"id": "gemini", "name": "Gemini 2.0"},
            {"id": "openai", "name": "GPT-4o"},
            {"id": "gpt4o_mini", "name": "GPT-4o mini"},
            {"id": "claude", "name": "Claude Sonnet"}
        ],
        "sizes": [
            {"id": "1792x1024", "name": "16:9 가로", "ratio": "16:9"},
            {"id": "1024x1792", "name": "9:16 세로", "ratio": "9:16"},
            {"id": "1024x1024", "name": "1:1 정사각형", "ratio": "1:1"}
        ],
        "designers": list(PRESET_DESIGNERS.values())
    }

# ============================================
# HTML UI
# ============================================
@app.get("/")
async def root():
    template_path = TEMPLATES_DIR / "index.html"
    if template_path.exists():
        return FileResponse(template_path, media_type="text/html")
    else:
        return HTMLResponse("<html><body><h1>Template not found</h1></body></html>")

if __name__ == "__main__":
    import uvicorn
    print("AI Image Generator v2.6 Server (Port: 8004)")
    uvicorn.run(app, host="0.0.0.0", port=8004)
