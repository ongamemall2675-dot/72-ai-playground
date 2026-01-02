# AI 이미지 생성기 (독립 모듈)

🖼️ Replicate Flux 기반 AI 이미지 생성 웹앱

## 기능

- **이미지 생성**: 영어 프롬프트로 고품질 이미지 생성
- **스타일 선택**: 리얼리스틱, 애니메, 시네마틱, 일러스트, 3D, 수채화
- **비율 지원**: 16:9, 9:16, 1:1, 4:3
- **n8n 웹훅**: 자동화 워크플로우 연동

## 설치

```bash
cd image-generator
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## API 키 설정

1. `api_secrets.json.example`를 `api_secrets.json`으로 복사
2. Replicate API 키 입력 (https://replicate.com/account/api-tokens)
3. Gemini API 키 입력 (선택, 대본 분석용)

```json
{
  "replicate_api_token": "r8_실제키",
  "gemini_api_key": "실제키"
}
```

## 실행

```bash
python main.py
```

→ http://localhost:8004 접속

## n8n 웹훅 엔드포인트

| 엔드포인트 | 설명 |
|------------|------|
| `POST /webhook/image/generate` | 단일 이미지 생성 |
| `POST /webhook/image/batch` | 배치 이미지 생성 |
| `POST /webhook/image/analyze-script` | 대본 분석 → 프롬프트 생성 |

### 요청 예시

```json
{
  "prompt_en": "A modern office building at sunset, golden hour lighting",
  "style": "realistic",
  "aspect_ratio": "16:9"
}
```

## 파일 구조

```
image-generator/
├── main.py              # FastAPI 앱
├── core/
│   ├── config.py        # 설정 관리
│   └── utils.py         # 유틸리티
├── generator/
│   └── image_generator.py  # 이미지 생성 로직
├── requirements.txt
├── api_secrets.json     # API 키 (Git 제외)
└── README.md
```

## 라이선스

MIT
