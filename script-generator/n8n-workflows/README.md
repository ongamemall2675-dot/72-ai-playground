# n8n 워크플로우 템플릿

Script Generator를 n8n과 통합하기 위한 즉시 사용 가능한 워크플로우 템플릿 모음입니다.

## 📦 포함된 워크플로우

### 1. `simple-script-generation.json`
**간단한 대본 생성 워크플로우**

- **트리거**: Webhook
- **기능**: HTTP 요청으로 대본 생성
- **사용 사례**: API 호출, 외부 앱 통합

**플로우**:
```
Webhook → Script Generator API → Respond
```

**사용 방법**:
1. n8n에서 "Import from File" 선택
2. `simple-script-generation.json` 파일 업로드
3. Webhook URL 복사
4. 해당 URL로 POST 요청 전송

**요청 예시**:
```bash
curl -X POST https://your-n8n-url/webhook/script-webhook \
  -H "Content-Type: application/json" \
  -d '{"topic": "부동산 투자 가이드", "ai_provider": "gemini"}'
```

---

### 2. `google-sheets-batch.json`
**Google Sheets 일괄 처리 워크플로우**

- **트리거**: Schedule (1시간마다)
- **기능**: Google Sheets의 주제 목록을 읽어 일괄 대본 생성
- **사용 사례**: 콘텐츠 제작 자동화, 대량 스크립트 생성

**플로우**:
```
Schedule → Google Sheets (읽기) → Script Generator API → 데이터 정리 → Google Sheets (쓰기)
```

**설정 방법**:
1. 워크플로우 import
2. Google Sheets 노드에서 Google 계정 연동
3. `YOUR_SHEET_ID` 를 실제 Sheet ID로 변경
4. Sheet 형식:
   - A열: topic (주제)
   - B열: category (카테고리, 선택사항)
   - Results 시트: 결과 저장

**Sheet 예시**:
| topic | category |
|-------|----------|
| 부동산 투자 초보 가이드 | real_estate |
| 건강한 식습관 만들기 | health |

---

### 3. `notion-integration.json`
**Notion 통합 워크플로우**

- **트리거**: Notion Database 업데이트
- **기능**: Notion 페이지 생성 시 자동 대본 생성 및 업데이트
- **사용 사례**: 프로젝트 관리, 콘텐츠 기획

**플로우**:
```
Notion Trigger → Script Generator API → Notion 업데이트 → 장면 분할 → Notion 장면 생성
```

**설정 방법**:
1. 워크플로우 import
2. Notion 노드에서 Notion 계정 연동
3. `YOUR_DATABASE_ID` 를 실제 Database ID로 변경
4. Notion Database 필드:
   - Topic (Title): 대본 주제
   - Category (Select): 카테고리
   - Duration (Select): 재생 시간
   - Tone (Select): 톤
   - Script (Text): 생성된 대본 (자동 입력)
   - AI Provider (Text): 사용된 AI (자동 입력)
   - Scene Count (Number): 장면 수 (자동 입력)
   - Status (Select): 상태 (자동 업데이트)
   - Generated At (Date): 생성 일시 (자동 입력)

---

## 🚀 빠른 시작

### 1. n8n에서 워크플로우 Import

1. n8n 대시보드 열기
2. 우측 상단 메뉴 → "Import from File" 클릭
3. 원하는 `.json` 파일 선택
4. "Import" 클릭

### 2. API URL 확인

모든 워크플로우의 HTTP Request 노드에서 URL 확인:
```
http://152.42.210.15:8003/webhook/script
```

또는 도메인 설정 시:
```
https://script.hyehwa72.org/webhook/script
```

### 3. 타임아웃 설정

HTTP Request 노드의 Options → Timeout을 **120000ms (2분)** 로 설정

---

## 🔧 커스터마이징

### AI Provider 변경
HTTP Request 노드의 JSON Body에서:
```json
"ai_provider": "gemini"  // 또는 "claude", "openai"
```

### 카테고리 변경
```json
"category": "real_estate"  // education, entertainment, finance, health, tech, vlog, other
```

### 자동 장면 분할 활성화/비활성화
```json
"auto_split_scenes": true  // 또는 false
```

---

## 📋 워크플로우 조합 예시

### 예시 1: 완전 자동화 콘텐츠 제작 파이프라인

```
Google Forms (주제 수집)
    ↓
Notion (주제 저장)
    ↓
Script Generator (대본 생성)
    ↓
TTS API (음성 생성)
    ↓
Video Generator (영상 생성)
    ↓
YouTube (자동 업로드)
```

### 예시 2: 주간 콘텐츠 스케줄러

```
Schedule (매주 월요일 9시)
    ↓
Airtable (이번 주 주제 가져오기)
    ↓
Script Generator (대본 생성)
    ↓
Slack (팀에 공유)
    ↓
Google Drive (대본 저장)
```

---

## 🔍 테스트 방법

### Webhook 워크플로우 테스트
```bash
curl -X POST https://your-n8n-url/webhook/script-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "테스트 주제",
    "ai_provider": "gemini",
    "duration": "1min"
  }'
```

### Schedule 워크플로우 테스트
1. n8n에서 워크플로우 열기
2. "Execute Workflow" 버튼 클릭
3. 실행 결과 확인

---

## ⚡ 성능 최적화

### 배치 처리
Google Sheets 워크플로우에서 HTTP Request 노드의 Options → Batching 설정:
- Batch Size: 1
- Batch Interval: 10000ms (10초)

이렇게 하면 각 요청 사이에 10초 간격을 두어 API 부하를 줄입니다.

### 에러 처리
각 노드에 "On Error" 설정 추가:
1. 노드 설정 → Settings → On Error
2. "Continue" 선택
3. Error Workflow 설정 (선택사항)

---

## 📊 모니터링

### 실행 이력 확인
- n8n 대시보드 → Executions 탭
- 각 실행의 상태, 소요 시간, 결과 확인 가능

### 실패한 실행 재시도
- Executions 탭에서 실패한 실행 선택
- "Retry Execution" 클릭

---

## 🆘 문제 해결

### "Request Timeout" 에러
→ HTTP Request 노드의 Timeout을 120000ms로 증가

### "Connection Refused" 에러
→ Script Generator 서버 상태 확인:
```bash
ssh root@152.42.210.15 "systemctl status script-generator"
```

### "Invalid API Key" 에러
→ 서버의 환경 변수에 AI API 키 설정 확인

### Notion/Google Sheets 연동 실패
→ 노드에서 계정 재인증 시도

---

## 💡 추가 리소스

- [Script Generator API 문서](../README.md)
- [n8n 통합 가이드](../N8N_INTEGRATION.md)
- [배포 가이드](../DEPLOYMENT_REPORT.md)

---

## 🤝 기여

더 유용한 워크플로우 템플릿이 있다면 PR을 보내주세요!

---

**Happy Automating!** 🎉
