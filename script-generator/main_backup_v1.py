# -*- coding: utf-8 -*-
"""
M-06 Script Generator 독립 웹앱
Port: 8003
n8n Webhook: /webhook/script
"""
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# 기존 대본 모듈 import
from m06_script_generator import (
    ScriptGenerator, get_script_generator, generate_script,
    ScriptGenerationRequest, DURATION_SETTINGS,
    calculate_script_duration, validate_script_length
)

from apps.core.utils import setup_cors, create_webhook_response

# ============================================
# FastAPI App
# ============================================
app = FastAPI(
    title="M-06 Script Generator",
    description="AI 대본 생성 모듈 - n8n 웹훅 지원",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

setup_cors(app)

# ============================================
# Request Models
# ============================================
class ScriptRequest(BaseModel):
    """대본 생성 요청"""
    topic: str = Field(..., description="주제")
    category: str = Field(default="education", description="카테고리")
    duration: str = Field(default="5min", description="목표 분량: 1min, 3min, 5min, 10min")
    structure: str = Field(default="hook_develop_resolve", description="대본 구조")
    tone: str = Field(default="friendly", description="톤앤매너")
    target_audience: Optional[str] = Field(default=None, description="타겟 시청자")
    key_points: Optional[List[str]] = Field(default=None, description="핵심 포인트")
    avoid_words: Optional[List[str]] = Field(default=None, description="피해야 할 단어")
    use_rag_learning: bool = Field(default=True, description="RAG 학습 사용")

class ScriptRegenerateRequest(BaseModel):
    """대본 재생성 요청"""
    original_script: str = Field(..., description="원본 대본")
    feedback: str = Field(..., description="수정 피드백")
    topic: str
    category: str = Field(default="education")
    duration: str = Field(default="5min")

# ============================================
# n8n Webhook Endpoints
# ============================================
@app.post("/webhook/script")
async def webhook_generate_script(request: ScriptRequest):
    """
    n8n 웹훅 - 대본 생성
    
    n8n에서 HTTP Request 노드로 호출:
    - Method: POST
    - URL: http://your-server:8003/webhook/script
    """
    try:
        generator = get_script_generator()
        
        gen_request = ScriptGenerationRequest(
            topic=request.topic,
            category=request.category,
            duration=request.duration,
            structure=request.structure,
            tone=request.tone,
            target_audience=request.target_audience,
            key_points=request.key_points,
            avoid_words=request.avoid_words,
            use_rag_learning=request.use_rag_learning
        )
        
        result = generator.generate(gen_request)
        
        return create_webhook_response(
            success=True,
            data={
                "script": result.script,
                "sections": [s.dict() for s in result.sections] if result.sections else [],
                "metadata": result.metadata,
                "duration_analysis": result.duration_analysis.dict() if result.duration_analysis else None
            },
            module="m06_script"
        )
    except Exception as e:
        return create_webhook_response(
            success=False,
            error=str(e),
            module="m06_script"
        )

@app.post("/webhook/script/regenerate")
async def webhook_regenerate_script(request: ScriptRegenerateRequest):
    """n8n 웹훅 - 피드백 반영 대본 재생성"""
    try:
        generator = get_script_generator()
        
        result = generator.regenerate(
            original_script=request.original_script,
            feedback=request.feedback,
            topic=request.topic,
            category=request.category,
            duration=request.duration
        )
        
        return create_webhook_response(
            success=True,
            data={
                "script": result.script,
                "sections": [s.dict() for s in result.sections] if result.sections else [],
                "changes_made": result.metadata.get("changes_made", []) if result.metadata else []
            },
            module="m06_script"
        )
    except Exception as e:
        return create_webhook_response(
            success=False,
            error=str(e),
            module="m06_script"
        )

@app.post("/webhook/script/duration")
async def webhook_analyze_duration(text: str = "", target_duration: str = "5min"):
    """n8n 웹훅 - 대본 분량 분석"""
    try:
        analysis = calculate_script_duration(text, target_duration)
        validation = validate_script_length(text, target_duration)
        
        return create_webhook_response(
            success=True,
            data={
                "analysis": analysis,
                "validation": validation
            },
            module="m06_script"
        )
    except Exception as e:
        return create_webhook_response(
            success=False,
            error=str(e),
            module="m06_script"
        )

# ============================================
# API Endpoints
# ============================================
@app.get("/")
async def root():
    return HTMLResponse("""
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI 슈퍼 대본 생성기 | M-06</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root { --gold-primary: #D4AF37; --gold-gradient: linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #B8860B 100%); --dark-bg: #0a0a0a; --dark-surface: #141414; --dark-elevated: #1e1e1e; --dark-border: #2a2a2a; --text-primary: #fff; --text-secondary: rgba(255,255,255,0.7); --text-muted: rgba(255,255,255,0.4); --success: #22c55e; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: var(--dark-bg); color: var(--text-primary); min-height: 100vh; }
        .header { background: linear-gradient(180deg, var(--dark-surface) 0%, transparent 100%); padding: 1.5rem 2rem; border-bottom: 1px solid var(--dark-border); display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 0.75rem; }
        .logo-icon { font-size: 2rem; }
        .logo-text { font-size: 1.5rem; font-weight: 600; background: var(--gold-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .status-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 9999px; font-size: 0.875rem; color: var(--success); }
        .status-dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .container { max-width: 1400px; margin: 0 auto; padding: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
        @media (max-width: 1024px) { .container { grid-template-columns: 1fr; } }
        .card { background: var(--dark-surface); border: 1px solid var(--dark-border); border-radius: 16px; padding: 1.5rem; }
        .card-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--dark-border); }
        .card-title { font-size: 1.125rem; font-weight: 600; color: var(--gold-primary); }
        .form-group { margin-bottom: 1.25rem; }
        .form-label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem; }
        .form-input, .form-select { width: 100%; padding: 0.75rem 1rem; background: var(--dark-elevated); border: 1px solid var(--dark-border); border-radius: 10px; color: var(--text-primary); font-family: inherit; }
        .form-input:focus, .form-select:focus { outline: none; border-color: var(--gold-primary); }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem 1.5rem; font-family: inherit; font-size: 1rem; font-weight: 600; border-radius: 12px; cursor: pointer; transition: all 0.3s; border: none; }
        .btn-primary { background: var(--gold-gradient); color: #000; width: 100%; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(212, 175, 55, 0.3); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .result-area { background: var(--dark-elevated); border-radius: 12px; padding: 1.5rem; min-height: 400px; white-space: pre-wrap; line-height: 1.8; }
        .placeholder { text-align: center; padding: 4rem 2rem; color: var(--text-muted); }
        .placeholder-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.3; }
        .spinner { width: 20px; height: 20px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .toast { position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem; background: var(--dark-surface); border: 1px solid var(--dark-border); border-radius: 12px; display: flex; align-items: center; gap: 0.75rem; transform: translateY(100px); opacity: 0; transition: all 0.3s; z-index: 1000; }
        .toast.show { transform: translateY(0); opacity: 1; }
        .footer-links { display: flex; gap: 1rem; margin-top: 1rem; }
        .footer-links a { color: var(--text-muted); text-decoration: none; font-size: 0.875rem; }
        .footer-links a:hover { color: var(--gold-primary); }
        .duration-badge { display: inline-block; background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.2); color: var(--gold-primary); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; margin-top: 0.5rem; }
        .settings-btn { background: var(--dark-elevated); border: 1px solid var(--dark-border); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; color: var(--text-secondary); font-family: inherit; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; }
        .settings-btn:hover { border-color: var(--gold-primary); color: var(--gold-primary); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: none; justify-content: center; align-items: center; z-index: 2000; }
        .modal-overlay.show { display: flex; }
        .modal { background: var(--dark-surface); border: 1px solid var(--dark-border); border-radius: 16px; width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto; }
        .modal-header { padding: 1.5rem; border-bottom: 1px solid var(--dark-border); display: flex; justify-content: space-between; align-items: center; }
        .modal-title { font-size: 1.25rem; font-weight: 600; color: var(--gold-primary); display: flex; align-items: center; gap: 0.5rem; }
        .modal-close { background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer; }
        .modal-close:hover { color: var(--text-primary); }
        .modal-body { padding: 1.5rem; }
        .key-item { background: var(--dark-elevated); border-radius: 10px; padding: 1rem; margin-bottom: 1rem; }
        .key-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .key-name { font-weight: 600; color: var(--text-primary); }
        .key-status { font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 9999px; }
        .key-status.configured { background: rgba(34,197,94,0.1); color: #22c55e; }
        .key-status.not-configured { background: rgba(239,68,68,0.1); color: #ef4444; }
        .key-input-row { display: flex; gap: 0.5rem; }
        .key-input { flex: 1; padding: 0.5rem; background: var(--dark-bg); border: 1px solid var(--dark-border); border-radius: 6px; color: var(--text-primary); font-family: monospace; font-size: 0.875rem; }
        .key-btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; }
        .key-btn.test { background: rgba(59,130,246,0.2); color: #3b82f6; }
        .key-btn.save { background: rgba(34,197,94,0.2); color: #22c55e; }
        .key-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    </style>
</head>
<body>
    <header class="header">
        <div class="logo"><span class="logo-icon">✨</span><span class="logo-text">AI 슈퍼 대본 생성기</span></div>
        <div style="display:flex;gap:1rem;align-items:center;">
            <button class="settings-btn" onclick="openSettings()">⚙️ API 설정</button>
            <div class="status-badge"><span class="status-dot"></span><span>준비됨</span></div>
        </div>
    </header>
    
    <!-- API 설정 모달 -->
    <div class="modal-overlay" id="settingsModal">
        <div class="modal">
            <div class="modal-header">
                <span class="modal-title">⚙️ API 설정</span>
                <button class="modal-close" onclick="closeSettings()">×</button>
            </div>
            <div class="modal-body" id="settingsBody">
                <p style="color:var(--text-muted);margin-bottom:1rem;">로딩 중...</p>
            </div>
        </div>
    </div>
    
    <div class="container">
        <div class="card">
            <div class="card-header"><span>✏️</span><span class="card-title">대본 설정</span></div>
            <div class="form-group">
                <label class="form-label">주제</label>
                <div style="display:flex;gap:0.5rem;">
                    <input class="form-input" id="topic" placeholder="영상 주제를 입력하세요..." style="flex:1;" />
                    <button class="btn" style="background:var(--dark-elevated);border:1px solid var(--dark-border);color:var(--text-secondary);padding:0.5rem 1rem;white-space:nowrap;" onclick="searchRagScripts()">🔍 참조 검색</button>
                </div>
            </div>
            
            <!-- RAG 참조 설정 -->
            <div class="form-group" style="background:var(--dark-elevated);padding:1rem;border-radius:10px;margin-bottom:1.5rem;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem;">
                    <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
                        <input type="checkbox" id="useRag" style="accent-color:var(--gold-primary);width:18px;height:18px;" checked />
                        <span style="font-weight:600;color:var(--gold-primary);">📚 RAG 대본 참조</span>
                    </label>
                    <span style="font-size:0.75rem;color:var(--text-muted);">떡상 대본 학습 활용</span>
                </div>
                <div id="ragResults" style="display:none;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--dark-border);">
                    <div style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:0.5rem;">📋 참조할 대본 선택:</div>
                    <div id="ragScriptList" style="max-height:150px;overflow-y:auto;">
                        <div style="color:var(--text-muted);font-size:0.875rem;text-align:center;padding:1rem;">주제 입력 후 '참조 검색' 버튼을 클릭하세요</div>
                    </div>
                </div>
            </div>
            
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">콘텐츠 유형</label>
                    <select class="form-select" id="contentType" onchange="updateCategories()">
                        <option value="shorts">📱 유튜브 쇼츠/릴스</option>
                        <option value="youtube" selected>📺 유튜브 일반 영상</option>
                        <option value="blog">📝 블로그 나레이션</option>
                        <option value="podcast">🎙️ 팟캐스트</option>
                        <option value="presentation">📢 프레젠테이션</option>
                        <option value="product">🛒 제품 소개</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">카테고리</label>
                    <select class="form-select" id="category">
                        <optgroup label="엔터테인먼트">
                            <option value="entertainment" selected>엔터테인먼트 (바이럴/썰)</option>
                            <option value="vlog">브이로그</option>
                            <option value="gaming">게임</option>
                        </optgroup>
                        <optgroup label="교육/정보">
                            <option value="education">교육/정보</option>
                            <option value="tutorial">튜토리얼/강좌</option>
                            <option value="review">리뷰</option>
                            <option value="news">뉴스/시사</option>
                        </optgroup>
                        <optgroup label="전문 분야">
                            <option value="real_estate">부동산</option>
                            <option value="finance">재테크/금융</option>
                            <option value="health">건강/피트니스</option>
                            <option value="tech">기술/IT</option>
                        </optgroup>
                        <optgroup label="라이프스타일">
                            <option value="lifestyle">라이프스타일</option>
                            <option value="cooking">요리</option>
                            <option value="travel">여행</option>
                            <option value="other">기타</option>
                        </optgroup>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">분량</label>
                    <select class="form-select" id="duration">
                        <option value="30sec">30초 (약 150자)</option>
                        <option value="1min">1분 (약 300자)</option>
                        <option value="5min" selected>5분 (약 1,500자)</option>
                        <option value="10min">10분 (약 3,000자)</option>
                        <option value="15-20min">15-20분 (약 5,000자)</option>
                        <option value="30min">30분 (약 9,000자)</option>
                        <option value="1hour">1시간 (약 18,000자)</option>
                        <option value="1hour+">1시간+ (약 25,000자)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">대본 구조</label>
                    <select class="form-select" id="structure">
                        <option value="hook_develop_resolve" selected>후킹-전개-해소 (바이럴)</option>
                        <option value="four_act">기-승-전-결 (전통적)</option>
                        <option value="problem_solution">문제-해결</option>
                        <option value="story_arc">스토리 아크 (장편)</option>
                        <option value="listicle">리스트형 (N가지 방법)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">대상 청중</label>
                    <select class="form-select" id="audience">
                        <option value="senior">👵 시니어 (60+) - TTS 최적화</option>
                        <option value="youth" selected>👨‍💼 청년 (20-30대) - 트렌디</option>
                        <option value="professional">👔 전문가/비즈니스</option>
                        <option value="general">🌍 일반 대중</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">톤앤매너</label>
                    <select class="form-select" id="tone">
                        <option value="friendly" selected>친근한 (일상/브이로그)</option>
                        <option value="professional">전문적인 (비즈니스/교육)</option>
                        <option value="humorous">유머러스 (엔터테인먼트)</option>
                        <option value="serious">진지한 (뉴스/시사)</option>
                        <option value="exciting">흥미진진한 (바이럴/동기부여)</option>
                        <option value="calm">차분한 (힐링/명상)</option>
                        <option value="dramatic">드라마틱 (썰/스토리)</option>
                    </select>
                </div>
            </div>
            <button class="btn btn-primary" id="generateBtn" onclick="generateScript()">
                <span id="btnText">✨ 대본 생성하기</span>
                <span id="btnSpinner" class="spinner" style="display:none;"></span>
            </button>
            <div class="footer-links">
                <a href="/docs">📖 API 문서</a>
                <a href="/api/options">⚙️ 옵션</a>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header"><span>📄</span><span class="card-title">생성된 대본</span></div>
            <div class="result-area" id="result">
                <div class="placeholder"><div class="placeholder-icon">📝</div><p>주제를 입력하고 생성 버튼을 클릭하세요</p></div>
            </div>
            <div id="durationInfo"></div>
        </div>
    </div>
    
    <div class="toast" id="toast"><span id="toastIcon">✅</span><span id="toastMessage"></span></div>
    
    <script>
        const API_BASE = 'https://api.hyehwa72.org';
        
        async function openSettings() {
            document.getElementById('settingsModal').classList.add('show');
            await loadApiKeys();
        }
        function closeSettings() { document.getElementById('settingsModal').classList.remove('show'); }
        
        async function loadApiKeys() {
            // 기본 서비스 목록 (오프라인 fallback)
            const defaultServices = [
                {service: 'gemini', name: 'Google Gemini', configured: false},
                {service: 'openai', name: 'OpenAI', configured: false},
                {service: 'replicate', name: 'Replicate (이미지)', configured: false},
                {service: 'google_tts', name: 'Google Cloud TTS', configured: false},
                {service: 'naver_clova', name: 'Naver CLOVA', configured: false},
                {service: 'youtube_api', name: 'YouTube Data API', configured: false}
            ];
            try {
                const res = await fetch(API_BASE + '/api/service-keys', {timeout: 5000});
                const data = await res.json();
                renderSettings(data.services || defaultServices);
            } catch (e) {
                // 연결 실패 시 기본 목록 표시
                console.warn('API 서버 연결 실패, 오프라인 모드:', e.message);
                renderSettings(defaultServices, true);
            }
        }
        
        function renderSettings(services, offline = false) {
            let header = offline ? '<p style="color:#f59e0b;margin-bottom:1rem;font-size:0.875rem;">⚠️ 오프라인 모드 - 서버 연결 후 저장됩니다</p>' : '';
            const html = header + services.map(s => `
                <div class="key-item">
                    <div class="key-header">
                        <span class="key-name">${s.name}</span>
                        <span class="key-status ${s.configured ? 'configured' : 'not-configured'}">${s.configured ? '✓ 설정됨' : '미설정'}</span>
                    </div>
                    <div class="key-input-row">
                        <input class="key-input" id="key_${s.service}" type="password" placeholder="${s.configured && s.masked_key ? s.masked_key : 'API 키 입력...'}" />
                        <button class="key-btn test" onclick="testKey('${s.service}')">테스트</button>
                        <button class="key-btn save" onclick="saveKey('${s.service}')">저장</button>
                    </div>
                </div>
            `).join('');
            document.getElementById('settingsBody').innerHTML = html;
        }
        
        async function testKey(service) {
            const key = document.getElementById('key_' + service).value;
            if (!key) { showToast('키를 입력해주세요', 'error'); return; }
            showToast('테스트 중...', 'success');
            // 간단한 길이 검증 (실제 테스트는 서버에서)
            if (key.length >= 10) { showToast('키 형식 OK', 'success'); }
            else { showToast('키가 너무 짧습니다', 'error'); }
        }
        
        async function saveKey(service) {
            const key = document.getElementById('key_' + service).value;
            if (!key) { showToast('키를 입력해주세요', 'error'); return; }
            try {
                const res = await fetch(API_BASE + '/api/service-keys', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ service: service, api_key: key })
                });
                const result = await res.json();
                if (result.message) { showToast('저장 완료!', 'success'); await loadApiKeys(); }
                else { showToast('저장 실패', 'error'); }
            } catch (e) { showToast('오류: ' + e.message, 'error'); }
        }
        
        // RAG 대본 검색 함수
        let selectedRagScripts = [];
        async function searchRagScripts() {
            const topic = document.getElementById('topic').value.trim();
            if (!topic) { showToast('주제를 먼저 입력해주세요', 'error'); return; }
            
            const ragResults = document.getElementById('ragResults');
            const ragList = document.getElementById('ragScriptList');
            ragList.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-muted);">🔍 검색 중...</div>';
            ragResults.style.display = 'block';
            
            try {
                // RAG 서버에서 관련 대본 검색
                const res = await fetch(API_BASE + '/api/rag/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: topic, limit: 5, type: 'script' })
                });
                const data = await res.json();
                
                if (data.results && data.results.length > 0) {
                    ragList.innerHTML = data.results.map((r, i) => `
                        <label style="display:flex;gap:0.5rem;padding:0.5rem;background:var(--dark-bg);border-radius:6px;margin-bottom:0.5rem;cursor:pointer;align-items:flex-start;">
                            <input type="checkbox" class="rag-checkbox" data-id="${r.id}" data-content="${encodeURIComponent(r.content || r.text || '')}" style="accent-color:var(--gold-primary);margin-top:3px;">
                            <div style="flex:1;">
                                <div style="font-size:0.875rem;font-weight:500;">${r.title || '대본 #' + (i+1)}</div>
                                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${r.category || '바이럴'} · 조회수 ${(r.views || 0).toLocaleString()} · ${(r.content || r.text || '').substring(0, 50)}...</div>
                            </div>
                            <span style="font-size:0.7rem;color:var(--success);">⭐${r.score?.toFixed(1) || '4.5'}</span>
                        </label>
                    `).join('');
                    showToast(data.results.length + '개 참조 대본 발견!', 'success');
                } else {
                    ragList.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-muted);">관련 대본이 없습니다. 새로운 대본을 생성합니다.</div>';
                }
            } catch (e) {
                // 서버 연결 실패 시 샘플 데이터 표시
                console.warn('RAG 서버 연결 실패:', e.message);
                ragList.innerHTML = `
                    <div style="padding:0.75rem;background:rgba(245,158,11,0.1);border-radius:6px;margin-bottom:0.5rem;">
                        <div style="font-size:0.875rem;color:#f59e0b;">⚠️ RAG 서버 연결 안됨</div>
                        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">AI가 자체 지식으로 대본을 생성합니다.</div>
                    </div>
                `;
            }
        }
        
        function getSelectedRagContents() {
            const checkboxes = document.querySelectorAll('.rag-checkbox:checked');
            return Array.from(checkboxes).map(cb => decodeURIComponent(cb.dataset.content || '')).filter(c => c);
        }
        
        async function generateScript() {
            const topic = document.getElementById('topic').value.trim();
            if (!topic) { showToast('주제를 입력해주세요', 'error'); return; }
            
            const btn = document.getElementById('generateBtn');
            btn.disabled = true;
            document.getElementById('btnText').textContent = '생성 중...';
            document.getElementById('btnSpinner').style.display = 'block';
            
            try {
                const res = await fetch('/webhook/script', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: topic,
                        content_type: document.getElementById('contentType').value,
                        category: document.getElementById('category').value,
                        duration: document.getElementById('duration').value,
                        structure: document.getElementById('structure').value,
                        target_audience: document.getElementById('audience').value,
                        tone: document.getElementById('tone').value,
                        use_rag_learning: document.getElementById('useRag').checked,
                        rag_references: getSelectedRagContents()
                    })
                });
                const result = await res.json();
                
                if (result.success) {
                    const script = result.data.script || '대본 생성 완료';
                    document.getElementById('result').textContent = script;
                    
                    // CPM 기반 시간 계산
                    const charCount = script.length;
                    const cpmSlow = 300, cpmNormal = 400, cpmFast = 500;
                    const secSlow = Math.round(charCount / cpmSlow * 60);
                    const secNormal = Math.round(charCount / cpmNormal * 60);
                    const secFast = Math.round(charCount / cpmFast * 60);
                    
                    document.getElementById('durationInfo').innerHTML = `
                        <div style="margin-top:1rem;padding:1rem;background:var(--dark-elevated);border-radius:10px;">
                            <div style="color:var(--gold-primary);font-weight:600;margin-bottom:0.5rem;">📊 발표 시간 계산</div>
                            <div style="font-size:0.9rem;">총 글자수: <strong>${charCount.toLocaleString()}자</strong></div>
                            <div style="display:flex;gap:1rem;margin-top:0.5rem;font-size:0.85rem;">
                                <span>🐢 느림(300CPM): ${Math.floor(secSlow/60)}분 ${secSlow%60}초</span>
                                <span style="color:var(--gold-primary);">◀ 보통(400CPM): ${Math.floor(secNormal/60)}분 ${secNormal%60}초</span>
                                <span>🏃 빠름(500CPM): ${Math.floor(secFast/60)}분 ${secFast%60}초</span>
                            </div>
                        </div>
                    `;
                    showToast('대본 생성 완료!', 'success');
                } else {
                    showToast(result.error || '생성 실패', 'error');
                }
            } catch (e) { showToast('오류: ' + e.message, 'error'); }
            finally {
                btn.disabled = false;
                document.getElementById('btnText').textContent = '✨ 대본 생성하기';
                document.getElementById('btnSpinner').style.display = 'none';
            }
        }
        function showToast(msg, type) {
            const toast = document.getElementById('toast');
            document.getElementById('toastIcon').textContent = type === 'success' ? '✅' : '❌';
            document.getElementById('toastMessage').textContent = msg;
            toast.className = 'toast ' + type + ' show';
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    </script>
</body>
</html>
    """)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "module": "m06_script", "port": 8003}

@app.get("/api/options")
async def get_options():
    return {
        "durations": DURATION_SETTINGS,
        "categories": ["education", "entertainment", "news", "tech", "lifestyle", "gaming"],
        "structures": ["hook_develop_resolve", "problem_solution", "story_arc", "listicle"],
        "tones": ["friendly", "professional", "casual", "dramatic", "news"]
    }

if __name__ == "__main__":
    import uvicorn
    print("M-06 Script Generator Start (Port: 8003)")
    uvicorn.run(app, host="0.0.0.0", port=8003)
