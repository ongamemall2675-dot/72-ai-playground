# 🔗 n8n 자동화 연동 가이드

## 개요
AI 이미지 생성기를 n8n 워크플로우에 연동하여 자동화할 수 있습니다.

---

## 📡 사용 가능한 Webhook 엔드포인트

### 1. **단일 이미지 생성**
```
POST http://image-gen.hyehwa72.org/api/images/generate
Content-Type: application/json

{
  "prompt_en": "A modern cityscape at sunset...",
  "negative_prompt": "blurry, low quality",
  "provider": "replicate",
  "size": "1792x1024"
}
```

**응답:**
```json
{
  "success": true,
  "image_url": "https://...",
  "provider": "replicate",
  "model": "flux-schnell"
}
```

---

### 2. **프롬프트 자동 생성 (AI)**
```
POST http://image-gen.hyehwa72.org/api/prompts/generate-ai
Content-Type: application/json

{
  "scenes": [
    {
      "scene_id": 1,
      "script_text": "환율 변동이 심합니다",
      "keywords": ["경제", "환율"],
      "emotion": "serious"
    }
  ],
  "designer_id": "cinematic_pro",
  "ai_provider": "gemini"
}
```

**응답:**
```json
{
  "success": true,
  "prompts": [
    {
      "scene_id": 1,
      "prompt_en": "[cinematic lighting, dramatic atmosphere]...",
      "prompt_ko": "긴박한 경제 상황을 보여주는 시각적 이미지...",
      "negative_prompt": "cartoon, anime, low quality"
    }
  ],
  "designer_used": "시네마틱 프로",
  "ai_provider": "gemini"
}
```

---

### 3. **배치 이미지 생성**
```
POST http://image-gen.hyehwa72.org/api/images/generate-batch
Content-Type: application/json

{
  "prompts": [
    {
      "scene_id": 1,
      "prompt_en": "Modern cityscape...",
      "negative_prompt": "blurry",
      "size": "1792x1024"
    },
    {
      "scene_id": 2,
      "prompt_en": "Peaceful nature...",
      "negative_prompt": "urban",
      "size": "1792x1024"
    }
  ],
  "provider": "replicate"
}
```

**응답:**
```json
{
  "success": true,
  "results": [
    {
      "scene_id": 1,
      "success": true,
      "image_url": "https://..."
    }
  ],
  "total": 2,
  "success_count": 2
}
```

---

### 4. **썸네일 프롬프트 생성**
```
POST http://image-gen.hyehwa72.org/api/thumbnails/generate
Content-Type: application/json

{
  "full_script": "전체 대본 내용...",
  "title": "영상 제목",
  "ai_provider": "gemini"
}
```

**응답:**
```json
{
  "success": true,
  "thumbnails": [
    {
      "id": 1,
      "korean_text": "충격 진실",
      "prompt_ko": "금이 간 지구본 위에 떨어지는 달러 지폐...",
      "prompt_en": "[Modern Cinematic], [Context: Economic crisis]..."
    }
  ]
}
```

---

### 5. **썸네일 이미지 생성**
```
POST http://image-gen.hyehwa72.org/api/thumbnails/generate-image
Content-Type: application/json

{
  "prompt_en": "[Modern Cinematic], [Context: Economic crisis]...",
  "korean_text": "충격 진실",
  "provider": "vertex",
  "size": "1792x1024",
  "negative_prompt": "blurry"
}
```

---

### 6. **전체 워크플로우 Webhook**
```
POST http://image-gen.hyehwa72.org/webhook/image/generate
Content-Type: application/json

{
  "scenes": [
    {
      "scene_id": 1,
      "script_text": "대본 내용",
      "keywords": ["키워드1", "키워드2"],
      "emotion": "happy"
    }
  ],
  "designer_id": "bright_cheerful",
  "provider": "replicate",
  "size": "1792x1024"
}
```

**응답:**
```json
{
  "success": true,
  "results": [
    {
      "scene_id": 1,
      "prompt": "생성된 프롬프트...",
      "image_url": "https://...",
      "success": true
    }
  ],
  "total": 1,
  "success_count": 1
}
```

---

## 🔧 n8n 워크플로우 예제

### 예제 1: M06 → 이미지 생성 자동화

```json
{
  "nodes": [
    {
      "name": "M06 Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "m06-complete"
      }
    },
    {
      "name": "AI 프롬프트 생성",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://image-gen.hyehwa72.org/api/prompts/generate-ai",
        "method": "POST",
        "jsonParameters": true,
        "bodyParametersJson": "={{ JSON.stringify({\n  scenes: $json.scenes,\n  designer_id: 'cinematic_pro',\n  ai_provider: 'gemini'\n}) }}"
      }
    },
    {
      "name": "이미지 배치 생성",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://image-gen.hyehwa72.org/api/images/generate-batch",
        "method": "POST",
        "jsonParameters": true,
        "bodyParametersJson": "={{ JSON.stringify({\n  prompts: $json.prompts,\n  provider: 'replicate'\n}) }}"
      }
    }
  ]
}
```

---

### 예제 2: 단일 이미지 생성

```json
{
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "generate-image"
      }
    },
    {
      "name": "이미지 생성",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://image-gen.hyehwa72.org/api/images/generate",
        "method": "POST",
        "jsonParameters": true,
        "bodyParametersJson": "={{ JSON.stringify({\n  prompt_en: $json.prompt,\n  provider: 'replicate',\n  size: '1792x1024'\n}) }}"
      }
    },
    {
      "name": "결과 반환",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}"
      }
    }
  ]
}
```

---

## 🎯 Provider 옵션

### 이미지 생성 Provider
- `dalle3` - OpenAI DALL-E 3 (고품질, 비용 높음)
- `replicate` - Replicate Flux Schnell (빠름, 저렴)
- `replicate-seedream` - ByteDance SeeDream-4 (고품질)
- `replicate-nano-banana` - Google Nano Banana (경량)
- `replicate-nano-banana-pro` - Google Nano Banana Pro (고품질)
- `vertex` - Vertex AI Imagen (자동 선택)
- `vertex-nano-banana` - Vertex Nano Banana
- `vertex-nano-banana-pro` - Vertex Nano Banana Pro

### AI 프롬프트 생성 Provider
- `gemini` - Google Gemini 2.0 Flash (권장)
- `gpt4o_mini` - OpenAI GPT-4o mini (빠름, 저렴)
- `openai` - OpenAI GPT-4o (고품질)
- `claude` - Anthropic Claude Sonnet (고품질)
- `none` - AI 사용 안함 (기본 프롬프트)

---

## 📐 크기(Size) 옵션

- `1792x1024` - 16:9 가로 (YouTube 썸네일, 영상)
- `1024x1792` - 9:16 세로 (인스타그램 스토리, 쇼츠)
- `1024x1024` - 1:1 정사각형 (인스타그램 피드)

---

## 🎨 Designer ID 목록

### 영상 스타일
- `cinematic_pro` - 시네마틱 프로
- `bright_cheerful` - 밝고 친근
- `tech_modern` - 테크 모던
- `gaming` - 게이머 스타일
- `education_clean` - 교육 클린
- `food_photography` - 푸드 사진
- `realestate_pro` - 부동산 프로
- `news_info` - 뉴스/정보

### 만화/애니메이션
- `webtoon_korean` - 한국 웹툰
- `webtoon_japanese` - 일본 애니메이션
- `stickman` - 스틱맨
- `cartoon_disney` - 디즈니 카툰
- `comic_marvel` - 마블 코믹스

### 아트 스타일
- `watercolor` - 수채화
- `oil_painting` - 유화
- `sketch_pencil` - 연필 스케치
- `pop_art` - 팝아트

### 사진/실사
- `photo_portrait` - 인물 사진
- `photo_landscape` - 풍경 사진
- `photo_product` - 제품 사진

### 특수 스타일
- `cyberpunk` - 사이버펑크
- `fantasy_epic` - 판타지 에픽
- `vintage_retro` - 빈티지 레트로
- `isometric_3d` - 아이소메트릭 3D
- `flat_design` - 플랫 디자인
- `lowpoly` - 로우폴리
- `pixel_art` - 픽셀 아트

---

## 🚨 에러 처리

모든 API는 다음 형식으로 에러를 반환합니다:

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

**일반적인 에러:**
- `API 키가 설정되지 않았습니다` - API 키 확인 필요
- `프롬프트가 필요합니다` - 요청 파라미터 확인
- `이미지 생성 실패` - Provider 상태 확인 또는 다른 provider 시도

---

## 🔐 보안

### CORS 설정
현재 모든 도메인에서 접근 가능 (`allow_origins=["*"]`)

프로덕션에서는 특정 도메인만 허용 권장:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://n8n.hyehwa72.org"],
    ...
)
```

### API 키 보호
- API 키는 서버의 `api_secrets.json`에 저장
- GitHub에 업로드되지 않음 (.gitignore)
- 환경변수 사용 권장

---

## 📊 Health Check

서비스 상태 확인:
```
GET http://image-gen.hyehwa72.org/health
```

**응답:**
```json
{
  "status": "healthy",
  "module": "image-generator",
  "version": "2.6.0"
}
```

---

## 🔄 n8n 워크플로우 템플릿

### 워크플로우 1: 대본 → AI 프롬프트 → 이미지 생성
1. **Webhook Trigger** - M06에서 대본 받기
2. **HTTP Request** - `/api/prompts/generate-ai` 호출
3. **Code Node** - 프롬프트 가공 (필요시)
4. **HTTP Request** - `/api/images/generate-batch` 호출
5. **Respond to Webhook** - 결과 반환

### 워크플로우 2: 썸네일 생성 자동화
1. **Webhook Trigger** - 전체 대본 받기
2. **HTTP Request** - `/api/thumbnails/generate` 호출
3. **Split In Batches** - 썸네일 3개 분리
4. **HTTP Request** - `/api/thumbnails/generate-image` 호출
5. **Merge** - 결과 병합
6. **Respond to Webhook** - 반환

### 워크플로우 3: 조건부 Provider 선택
1. **Webhook Trigger**
2. **If Node** - 이미지 품질 요구사항 확인
   - 고품질 → `vertex-nano-banana-pro`
   - 일반 → `replicate`
   - 빠른 생성 → `replicate-seedream`
3. **HTTP Request** - 선택된 provider로 생성
4. **Respond to Webhook**

---

## 💡 베스트 프랙티스

1. **배치 생성 사용** - 여러 이미지는 한 번에 생성 (`/api/images/generate-batch`)
2. **적절한 Provider 선택**
   - 테스트: `replicate` (빠르고 저렴)
   - 프로덕션: `vertex-nano-banana-pro` (고품질)
3. **에러 핸들링** - n8n에서 try-catch 사용
4. **타임아웃 설정** - 이미지 생성은 시간이 걸림 (60-300초)
5. **캐싱** - 동일한 프롬프트는 재사용

---

## 📞 지원

API 관련 문제:
- **로그**: `sudo journalctl -u image-generator -f`
- **Health Check**: `http://image-gen.hyehwa72.org/health`
- **API Docs**: `http://image-gen.hyehwa72.org/docs`

n8n 연동 문제:
- n8n 워크플로우 로그 확인
- HTTP Request 노드의 응답 확인
- CORS 설정 확인
