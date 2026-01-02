# -*- coding: utf-8 -*-
"""
M-06 Script Generator v2.0
AI 대본 생성기 - 다중 AI, 작가 페르소나, 장면 분할
Port: 8003
"""
import sys
import json
import os
import re
import httpx
from pathlib import Path
from datetime import datetime
from typing import Optional, List
from enum import Enum

PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Configuration
RAG_SERVER_URL = os.getenv("RAG_SERVER_URL", "http://152.42.210.15:8000")
LOCAL_WRITERS_FILE = Path(__file__).parent / "writers.json"

# ============================================
# Enums
# ============================================
class AIProvider(str, Enum):
    GEMINI = "gemini"
    CLAUDE = "claude"
    OPENAI = "openai"

class ScriptCategory(str, Enum):
    EDUCATION = "education"
    ENTERTAINMENT = "entertainment"
    REAL_ESTATE = "real_estate"
    FINANCE = "finance"
    HEALTH = "health"
    TECH = "tech"
    VLOG = "vlog"
    OTHER = "other"

class ScriptTone(str, Enum):
    FRIENDLY = "friendly"
    PROFESSIONAL = "professional"
    HUMOROUS = "humorous"
    DRAMATIC = "dramatic"
    CALM = "calm"

class ScriptStructure(str, Enum):
    HOOK_DEVELOP_RESOLVE = "hook_develop_resolve"
    FOUR_ACT = "four_act"
    PROBLEM_SOLUTION = "problem_solution"
    LISTICLE = "listicle"

class ScriptDuration(str, Enum):
    SEC_30 = "30sec"
    MIN_1 = "1min"
    MIN_5 = "5min"
    MIN_10 = "10min"

# ============================================
# Models
# ============================================
class WriterPersona(BaseModel):
    id: Optional[str] = None
    name: str
    persona: str = ""
    environment: str = ""
    speech_style: str = ""
    output_format: str = ""
    forbidden_words: List[str] = []
    required_keywords: List[str] = []
    custom_instructions: str = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ScriptGenerationRequest(BaseModel):
    topic: str
    ai_provider: str = "gemini"
    category: str = "education"
    duration: str = "5min"
    structure: str = "hook_develop_resolve"
    tone: str = "friendly"
    audience_age: str = "all"
    audience_gender: str = "all"
    audience_persona: str = "general"
    hook_style: str = "question"
    cta_type: str = "subscribe"
    required_keywords: List[str] = []
    forbidden_words: List[str] = []
    writer_id: Optional[str] = None
    custom_instructions: str = ""
    auto_split_scenes: bool = False

class ScriptEditRequest(BaseModel):
    script: str
    feedback: str
    ai_provider: str = "gemini"

class SceneSplitRequest(BaseModel):
    script: str
    mode: str = "auto"
    ai_provider: str = "gemini"
    scene_count: Optional[int] = None

# ============================================
# FastAPI App
# ============================================
app = FastAPI(
    title="M-06 Script Generator v2.0",
    description="AI 대본 생성기 - 다중 AI, 작가 페르소나, 장면 분할",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# AI Providers
# ============================================
async def call_gemini(prompt: str, system_prompt: str = "") -> str:
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(500, "Gemini API key not set")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    contents = []
    if system_prompt:
        contents.append({"role": "user", "parts": [{"text": f"[System]\n{system_prompt}"}]})
        contents.append({"role": "model", "parts": [{"text": "understood."}]})
    contents.append({"role": "user", "parts": [{"text": prompt}]})
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.post(url, json={"contents": contents})
        if res.status_code != 200:
            raise HTTPException(res.status_code, f"Gemini error: {res.text}")
        return res.json()["candidates"][0]["content"]["parts"][0]["text"]

async def call_claude(prompt: str, system_prompt: str = "") -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise HTTPException(500, "Claude API key not set")
    
    headers = {"x-api-key": api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
    body = {"model": "claude-sonnet-4-20250514", "max_tokens": 8000, "messages": [{"role": "user", "content": prompt}]}
    if system_prompt:
        body["system"] = system_prompt
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=body)
        if res.status_code != 200:
            raise HTTPException(res.status_code, f"Claude error: {res.text}")
        return res.json()["content"][0]["text"]

async def call_openai(prompt: str, system_prompt: str = "") -> str:
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise HTTPException(500, "OpenAI API key not set")
    
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json={"model": "gpt-4o", "messages": messages, "max_tokens": 8000})
        if res.status_code != 200:
            raise HTTPException(res.status_code, f"OpenAI error: {res.text}")
        return res.json()["choices"][0]["message"]["content"]

async def call_ai(provider: str, prompt: str, system_prompt: str = "") -> str:
    if provider == "claude":
        return await call_claude(prompt, system_prompt)
    elif provider == "openai":
        return await call_openai(prompt, system_prompt)
    return await call_gemini(prompt, system_prompt)

# ============================================
# Prompt Builders
# ============================================
def build_system_prompt(request: ScriptGenerationRequest, writer: Optional[WriterPersona] = None) -> str:
    parts = ["당신은 전문 유튜브 대본 작가입니다."]
    
    if writer:
        if writer.persona:
            parts.append(f"\n[작가 페르소나]\n{writer.persona}")
        if writer.speech_style:
            parts.append(f"\n[말투]\n{writer.speech_style}")
        if writer.environment:
            parts.append(f"\n[환경]\n{writer.environment}")
    
    if request.custom_instructions:
        parts.append(f"\n[사용자 지침]\n{request.custom_instructions}")
    
    # 청중 정보
    audience = []
    if request.audience_age != "all":
        age_map = {"teen": "10대", "20s": "20대", "30s": "30대", "40s": "40대", "50s": "50대"}
        audience.append(age_map.get(request.audience_age, request.audience_age))
    if request.audience_gender != "all":
        gender_map = {"male": "남성", "female": "여성"}
        audience.append(gender_map.get(request.audience_gender, ""))
    if request.audience_persona != "general":
        persona_map = {"investor": "투자자", "first_buyer": "내집마련 준비자", "curious": "호기심 많은 일반인"}
        audience.append(persona_map.get(request.audience_persona, ""))
    if audience:
        parts.append(f"\n[타겟 청중]: {', '.join(audience)}")
    
    # 금지어/필수어
    forbidden = list(set((writer.forbidden_words if writer else []) + request.forbidden_words))
    if forbidden:
        parts.append(f"\n[금지어]: {', '.join(forbidden)}")
    
    return "\n".join(parts)

def build_script_prompt(request: ScriptGenerationRequest) -> str:
    duration_map = {
        "30sec": ("30초", "약 150자"),
        "1min": ("1분", "약 300자"),
        "5min": ("5분", "약 1,500자"),
        "10min": ("10분", "약 3,000자")
    }
    duration_info = duration_map.get(request.duration, ("5분", "약 1,500자"))
    
    tone_map = {
        "friendly": "친근하고 편안한",
        "professional": "전문적이고 신뢰감 있는",
        "humorous": "유머러스하고 재미있는",
        "dramatic": "드라마틱하고 감정적인",
        "calm": "차분하고 안정적인"
    }
    tone_desc = tone_map.get(request.tone, "친근한")
    
    structure_map = {
        "hook_develop_resolve": "후킹 → 전개 → 해소",
        "four_act": "기 → 승 → 전 → 결",
        "problem_solution": "문제 제기 → 해결책",
        "listicle": "서론 → N가지 포인트 → 마무리"
    }
    structure_desc = structure_map.get(request.structure, "후킹-전개-해소")
    
    hook_map = {
        "question": "질문형 후킹으로 시작 (예: '혹시 ~해본 적 있으세요?')",
        "shock": "충격적인 사실로 시작",
        "empathy": "공감형으로 시작",
        "number": "숫자/통계로 시작"
    }
    hook_instruction = hook_map.get(request.hook_style, "질문형 후킹")
    
    cta_map = {
        "subscribe": "구독과 좋아요 유도",
        "comment": "댓글 참여 유도",
        "none": "CTA 없이 자연스러운 마무리"
    }
    cta_instruction = cta_map.get(request.cta_type, "구독 유도")
    
    return f"""다음 조건에 맞는 유튜브 대본을 작성해주세요:

[주제]: {request.topic}
[분량]: {duration_info[0]} ({duration_info[1]})
[톤앤매너]: {tone_desc}
[구조]: {structure_desc}
[후킹]: {hook_instruction}
[마무리]: {cta_instruction}

[요구사항]
1. 실제 유튜버가 말하는 것처럼 자연스러운 구어체로 작성
2. 적절한 감정 표현과 강조점 포함
3. 시청자가 끝까지 볼 수 있도록 몰입감 있게 작성
4. TTS로 읽힐 것을 고려해 발음하기 쉽게 작성

대본만 출력하세요. 다른 설명은 필요 없습니다."""

def build_scene_split_prompt(script: str, scene_count: Optional[int] = None) -> str:
    count_instruction = f"정확히 {scene_count}개의 장면으로" if scene_count else "장면당 약 15자 내외로"
    
    return f"""다음 대본을 {count_instruction} 분할하세요.

[대본]
{script}

[출력 형식 - 정확히 따르세요]
```json
[
  {{
    "scene_id": 1,
    "script_text": "장면 텍스트",
    "keywords": ["키워드"],
    "emotion": "neutral"
  }}
]
```

[필수 규칙]
1. 각 장면은 한글 기준 약 15자 내외로 분할
2. 의미가 끊기는 자연스러운 지점에서 분할 (문장 중간에 자르지 말 것)
3. script_text 필드명 반드시 사용
4. keywords는 한글 1~2개, 이모티콘 절대 금지
5. emotion: neutral/curious/happy/sad/excited/serious/warm/dramatic 중 하나만
6. 이모티콘, 이모지, 특수문자 사용 금지

JSON 배열만 출력. 설명 없이 JSON만."""

# ============================================
# Writer Management (Local File Fallback)
# ============================================
def load_local_writers() -> dict:
    if LOCAL_WRITERS_FILE.exists():
        with open(LOCAL_WRITERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"writers": []}

def save_local_writers(data: dict):
    with open(LOCAL_WRITERS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

async def load_writer(writer_id: str) -> Optional[WriterPersona]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"{RAG_SERVER_URL}/api/writers/{writer_id}")
            if res.status_code == 200:
                data = res.json()
                return WriterPersona(**data.get("writer", data))
    except:
        pass
    # Fallback to local
    local_data = load_local_writers()
    for w in local_data.get("writers", []):
        if w.get("id") == writer_id:
            return WriterPersona(**w)
    return None


# ============================================
# API Endpoints
# ============================================
@app.get("/", response_class=HTMLResponse)
async def root():
    """HTML UI 반환"""
    html_path = Path(__file__).parent / "templates" / "index.html"
    if html_path.exists():
        return FileResponse(html_path, media_type="text/html")
    return HTMLResponse("<h1>M-06 Script Generator v2.0</h1><p>템플릿 파일 없음</p>")

@app.get("/health")
async def health():
    return {"status": "healthy", "module": "m06_script", "port": 8003, "version": "2.0.0"}

@app.get("/api/options")
async def get_options():
    return {
        "ai_providers": ["gemini", "claude", "openai"],
        "categories": [e.value for e in ScriptCategory],
        "tones": [e.value for e in ScriptTone],
        "structures": [e.value for e in ScriptStructure],
        "durations": [e.value for e in ScriptDuration]
    }

# ============================================
# Script Generation
# ============================================
@app.post("/webhook/script")
@app.post("/api/generate")
async def generate_script(request: ScriptGenerationRequest):
    try:
        writer = None
        if request.writer_id:
            writer = await load_writer(request.writer_id)
        
        system_prompt = build_system_prompt(request, writer)
        user_prompt = build_script_prompt(request)
        
        script = await call_ai(request.ai_provider, user_prompt, system_prompt)
        
        scenes = None
        if request.auto_split_scenes:
            scenes = await split_scenes_internal(script, request.ai_provider)
        
        return {
            "success": True,
            "script": script,
            "scenes": scenes,
            "metadata": {
                "ai_provider": request.ai_provider,
                "topic": request.topic,
                "duration": request.duration,
                "generated_at": datetime.now().isoformat()
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/edit")
async def edit_script(request: ScriptEditRequest):
    try:
        prompt = f"""다음 대본을 수정해주세요:

[원본 대본]
{request.script}

[수정 요청]
{request.feedback}

수정된 대본만 출력하세요."""
        
        edited = await call_ai(request.ai_provider, prompt)
        return {"success": True, "script": edited}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/split-scenes")
async def split_scenes(request: SceneSplitRequest):
    try:
        scenes = await split_scenes_internal(
            request.script,
            request.ai_provider,
            request.scene_count if request.mode == "manual" else None
        )
        return {"success": True, "scenes": scenes, "count": len(scenes)}
    except Exception as e:
        return {"success": False, "error": str(e)}

async def split_scenes_internal(script: str, ai_provider: str, scene_count: Optional[int] = None) -> list:
    prompt = build_scene_split_prompt(script, scene_count)
    result = await call_ai(ai_provider, prompt)
    
    json_match = re.search(r'\[[\s\S]*\]', result)
    if json_match:
        return json.loads(json_match.group())
    return []

# ============================================
# Writer Management
# ============================================
@app.get("/api/writers")
async def list_writers():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"{RAG_SERVER_URL}/api/writers")
            if res.status_code == 200:
                return res.json()
    except:
        pass
    return load_local_writers()

@app.post("/api/writers")
async def save_writer(writer: WriterPersona):
    if not writer.id:
        writer.id = f"writer_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    writer.created_at = writer.created_at or datetime.now().isoformat()
    writer.updated_at = datetime.now().isoformat()
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(f"{RAG_SERVER_URL}/api/writers", json=writer.dict())
            if res.status_code == 200:
                return {"success": True, "writer": writer.dict()}
    except:
        pass
    
    # Local fallback
    data = load_local_writers()
    found = False
    for i, w in enumerate(data["writers"]):
        if w.get("id") == writer.id:
            data["writers"][i] = writer.dict()
            found = True
            break
    if not found:
        data["writers"].append(writer.dict())
    save_local_writers(data)
    return {"success": True, "writer": writer.dict()}

@app.get("/api/writers/{writer_id}")
async def get_writer(writer_id: str):
    writer = await load_writer(writer_id)
    if writer:
        return {"success": True, "writer": writer.dict()}
    return {"success": False, "error": "Not found"}

@app.delete("/api/writers/{writer_id}")
async def delete_writer(writer_id: str):
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.delete(f"{RAG_SERVER_URL}/api/writers/{writer_id}")
            if res.status_code == 200:
                return {"success": True}
    except:
        pass
    
    data = load_local_writers()
    data["writers"] = [w for w in data["writers"] if w.get("id") != writer_id]
    save_local_writers(data)
    return {"success": True}

# ============================================
# Generate Instructions from Options
# ============================================
@app.post("/api/generate-instructions")
async def generate_instructions(options: dict):
    prompt = f"""다음 옵션들을 바탕으로 대본 작가를 위한 상세한 지침을 생성해주세요:

옵션:
- 카테고리: {options.get('category', '교육')}
- 톤: {options.get('tone', '친근한')}
- 대상 연령: {options.get('audience_age', '전체')}
- 대상 페르소나: {options.get('audience_persona', '일반')}
- 후킹 스타일: {options.get('hook_style', '질문형')}

다음 형식으로 지침을 생성해주세요:

[페르소나]
(이 작가가 어떤 캐릭터인지)

[말투/어투]
(구체적인 말투 예시)

[환경/상황]
(어떤 상황에서 말하는 것처럼)

각 섹션을 상세하게 작성해주세요."""

    result = await call_ai(options.get("ai_provider", "gemini"), prompt)
    
    sections = {}
    current_section = None
    current_content = []
    
    for line in result.split('\n'):
        if line.startswith('[') and line.endswith(']'):
            if current_section:
                sections[current_section] = '\n'.join(current_content).strip()
            current_section = line[1:-1]
            current_content = []
        else:
            current_content.append(line)
    if current_section:
        sections[current_section] = '\n'.join(current_content).strip()
    
    return {
        "success": True,
        "instructions": {
            "persona": sections.get("페르소나", ""),
            "speech_style": sections.get("말투/어투", ""),
            "environment": sections.get("환경/상황", "")
        }
    }

# ============================================
# API Key Testing & Settings
# ============================================
class ApiKeyTestRequest(BaseModel):
    provider: str
    api_key: str

class SettingsRequest(BaseModel):
    api_keys: dict = {}
    rag_server_url: str = ""

# In-memory settings (also can save to env)
runtime_settings = {
    "api_keys": {"gemini": "", "claude": "", "openai": ""},
    "rag_server_url": ""
}

@app.post("/api/test-api-key")
async def test_api_key(request: ApiKeyTestRequest):
    """Test if an API key is valid"""
    provider = request.provider
    key = request.api_key
    
    try:
        if provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}"
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, json={
                    "contents": [{"role": "user", "parts": [{"text": "Hi"}]}]
                })
                if res.status_code == 200:
                    # Save to runtime
                    runtime_settings["api_keys"]["gemini"] = key
                    os.environ["GEMINI_API_KEY"] = key
                    return {"success": True, "message": "Gemini API key is valid"}
                else:
                    return {"success": False, "error": f"Invalid key: {res.status_code}"}
        
        elif provider == "claude":
            headers = {"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 10,
                    "messages": [{"role": "user", "content": "Hi"}]
                })
                if res.status_code == 200:
                    runtime_settings["api_keys"]["claude"] = key
                    os.environ["ANTHROPIC_API_KEY"] = key
                    return {"success": True, "message": "Claude API key is valid"}
                else:
                    return {"success": False, "error": f"Invalid key: {res.status_code}"}
        
        elif provider == "openai":
            headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": "Hi"}],
                    "max_tokens": 10
                })
                if res.status_code == 200:
                    runtime_settings["api_keys"]["openai"] = key
                    os.environ["OPENAI_API_KEY"] = key
                    return {"success": True, "message": "OpenAI API key is valid"}
                else:
                    return {"success": False, "error": f"Invalid key: {res.status_code}"}
        
        return {"success": False, "error": "Unknown provider"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/settings")
async def save_settings(request: SettingsRequest):
    """Save API settings"""
    global RAG_SERVER_URL
    
    for provider, key in request.api_keys.items():
        if key:
            runtime_settings["api_keys"][provider] = key
            if provider == "gemini":
                os.environ["GEMINI_API_KEY"] = key
            elif provider == "claude":
                os.environ["ANTHROPIC_API_KEY"] = key
            elif provider == "openai":
                os.environ["OPENAI_API_KEY"] = key
    
    if request.rag_server_url:
        runtime_settings["rag_server_url"] = request.rag_server_url
        RAG_SERVER_URL = request.rag_server_url
    
    return {"success": True, "message": "Settings saved"}

@app.get("/api/settings")
async def get_settings():
    """Get current settings (keys masked)"""
    masked = {}
    for k, v in runtime_settings["api_keys"].items():
        if v:
            masked[k] = v[:8] + "..." + v[-4:] if len(v) > 12 else "***"
        else:
            masked[k] = ""
    return {
        "api_keys": masked,
        "rag_server_url": runtime_settings["rag_server_url"]
    }

# ============================================
# Main
# ============================================
if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("M-06 Script Generator v2.0")
    print("=" * 50)
    print("[*] Starting server on http://localhost:8003")
    print("[*] API Docs: http://localhost:8003/docs")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8003)
