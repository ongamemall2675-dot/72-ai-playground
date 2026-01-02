# 🎬 AI Script Generator v2.0 (AI 대본 생성기)

다중 AI 모델을 활용한 프로페셔널 유튜브 대본 생성기

## ✨ 주요 기능

- **다중 AI 지원**: Gemini 2.0, Claude Sonnet 4, GPT-4o
- **작가 페르소나**: 커스터마이징 가능한 작가 스타일 저장/관리
- **장면 분할**: AI 기반 자동 장면 분할 및 키워드 추출
- **다양한 대본 스타일**: 교육, 엔터테인먼트, 부동산, 금융 등
- **구조화된 프롬프트**: 후킹-전개-해소, 기승전결, 문제-해결 등
- **청중 타겟팅**: 연령, 성별, 페르소나별 맞춤형 대본

## 🚀 로컬 실행

### 1. 의존성 설치

```bash
pip install -r requirements.txt
```

### 2. 환경 변수 설정

`.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일에 API 키 입력:

```
GEMINI_API_KEY=your_api_key
ANTHROPIC_API_KEY=your_api_key
OPENAI_API_KEY=your_api_key
```

### 3. 서버 실행

```bash
python main.py
```

또는

```bash
uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

### 4. 접속

- **웹 UI**: http://localhost:8003
- **API 문서**: http://localhost:8003/docs

## 🌐 서버 배포

### 1. 서버에 코드 배포

```bash
./deploy.sh
```

### 2. Systemd 서비스 설정 (서버에서)

```bash
sudo cp script-generator.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable script-generator
sudo systemctl start script-generator
```

### 3. Nginx 설정 (서버에서)

```bash
sudo cp nginx-script-generator.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/nginx-script-generator.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 📡 API 엔드포인트

### 대본 생성

```bash
POST /api/generate
POST /webhook/script  # n8n 웹훅 호환
```

**요청 예시:**

```json
{
  "topic": "부동산 투자 초보자를 위한 가이드",
  "ai_provider": "gemini",
  "category": "real_estate",
  "duration": "5min",
  "structure": "hook_develop_resolve",
  "tone": "professional",
  "auto_split_scenes": true
}
```

### 대본 수정

```bash
POST /api/edit
```

### 장면 분할

```bash
POST /api/split-scenes
```

### 작가 페르소나 관리

```bash
GET    /api/writers          # 목록 조회
POST   /api/writers          # 저장
GET    /api/writers/{id}     # 조회
DELETE /api/writers/{id}     # 삭제
```

## 🔧 설정

### AI Provider 테스트

```bash
POST /api/test-api-key
```

```json
{
  "provider": "gemini",
  "api_key": "your_api_key"
}
```

## 📋 옵션

### AI Providers
- `gemini` - Gemini 2.0 Flash
- `claude` - Claude Sonnet 4
- `openai` - GPT-4o

### Categories
- `education` - 교육
- `entertainment` - 엔터테인먼트
- `real_estate` - 부동산
- `finance` - 금융
- `health` - 건강
- `tech` - 기술
- `vlog` - 브이로그
- `other` - 기타

### Durations
- `30sec` - 30초
- `1min` - 1분
- `5min` - 5분
- `10min` - 10분

### Tones
- `friendly` - 친근한
- `professional` - 전문적인
- `humorous` - 유머러스
- `dramatic` - 드라마틱
- `calm` - 차분한

### Structures
- `hook_develop_resolve` - 후킹-전개-해소
- `four_act` - 기승전결
- `problem_solution` - 문제-해결
- `listicle` - 리스트형

## 🔗 n8n 통합

n8n에서 웹훅으로 사용 가능:

```
POST https://your-domain.com/webhook/script
```

## 📝 라이센스

MIT License

## 👨‍💻 개발자

Hyehwa 72 Real Estate - AI Development Team

## 🆘 문제 해결

### 포트 충돌
다른 포트로 실행:

```bash
uvicorn main:app --port 8004
```

### API 키 에러
환경 변수가 제대로 설정되었는지 확인:

```bash
echo $GEMINI_API_KEY
```

### 서비스 상태 확인

```bash
sudo systemctl status script-generator
sudo journalctl -u script-generator -f
```
