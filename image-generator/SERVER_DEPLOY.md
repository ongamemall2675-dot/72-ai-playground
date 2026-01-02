# 🚀 서버 배포 - 초간단 가이드

## ✅ 준비 완료!

모든 파일이 GitHub에 업로드되었습니다!
- Repository: `https://github.com/ongamemall2675-dot/72-ai-playground.git`
- Branch: `main`
- 포트: `8004`

---

## 1️⃣ 서버에서 단 한 줄 명령으로 배포 완료

### SSH로 서버 접속:
```bash
ssh realhun@서버IP
```

### 원스텝 배포 실행:
```bash
curl -sSL https://raw.githubusercontent.com/ongamemall2675-dot/72-ai-playground/main/image-generator/one-step-deploy.sh | bash
```

또는 다운로드 후 실행:
```bash
wget https://raw.githubusercontent.com/ongamemall2675-dot/72-ai-playground/main/image-generator/one-step-deploy.sh
chmod +x one-step-deploy.sh
./one-step-deploy.sh
```

**이 한 줄로 자동으로:**
- ✅ Git 저장소 클론
- ✅ Python 가상환경 생성
- ✅ 의존성 설치
- ✅ Systemd 서비스 등록
- ✅ Nginx 설정 및 활성화
- ✅ 방화벽 설정
- ✅ 서비스 시작
- ✅ 상태 확인

---

## 2️⃣ API 키 설정 (중요!)

배포 스크립트 실행 중 또는 실행 후:

```bash
nano /home/realhun/72놀이터/72-ai-playground/image-generator/api_secrets.json
```

다음 내용 입력:
```json
{
  "openai_api_key": "sk-proj-...",
  "replicate_api_token": "r8_...",
  "gemini_api_key": "AIza...",
  "claude_api_key": "sk-ant-...",
  "vertex_api_key": "AIza..."
}
```

저장: `Ctrl+X` → `Y` → `Enter`

서비스 재시작:
```bash
sudo systemctl restart image-generator
```

---

## 3️⃣ 도메인 설정 (선택사항)

### DNS 설정
도메인 DNS에서 A 레코드 추가:
```
image-gen.hyehwa72.org → 서버 IP
```

### SSL 인증서 설치 (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d image-gen.hyehwa72.org
```

---

## 4️⃣ 배포 확인

### 상태 확인
```bash
sudo systemctl status image-generator
```

### 로그 확인
```bash
sudo journalctl -u image-generator -f
```

### 접속 테스트
브라우저에서:
- `http://서버IP:8004`
- `http://서버IP:8004/health`
- `http://image-gen.hyehwa72.org` (도메인 설정 시)

또는 터미널에서:
```bash
curl http://localhost:8004/health
```

---

## 🔗 n8n 연동

### Webhook URL
```
http://image-gen.hyehwa72.org/webhook/image/generate
```

### API 엔드포인트
```
http://image-gen.hyehwa72.org/api/images/generate
http://image-gen.hyehwa72.org/api/prompts/generate-ai
http://image-gen.hyehwa72.org/api/images/generate-batch
```

자세한 내용:
```bash
cat /home/realhun/72놀이터/72-ai-playground/image-generator/N8N_INTEGRATION.md
```

---

## 🛠️ 관리 명령어

```bash
# 서비스 제어
sudo systemctl start image-generator     # 시작
sudo systemctl stop image-generator      # 중지
sudo systemctl restart image-generator   # 재시작
sudo systemctl status image-generator    # 상태 확인

# 로그 확인
sudo journalctl -u image-generator -f    # 실시간 로그
sudo journalctl -u image-generator -n 100  # 최근 100줄

# 코드 업데이트
cd /home/realhun/72놀이터/72-ai-playground/image-generator
git pull origin main
sudo systemctl restart image-generator

# Nginx 재로드
sudo systemctl reload nginx
```

---

## 📊 배포 완료 체크리스트

- [ ] 서버에 SSH 접속 가능
- [ ] 원스텝 배포 스크립트 실행 완료
- [ ] API 키 설정 완료
- [ ] 서비스 실행 중 (`systemctl status image-generator`)
- [ ] Health Check 성공 (`curl http://localhost:8004/health`)
- [ ] 브라우저에서 접속 가능
- [ ] (선택) 도메인 연결 완료
- [ ] (선택) SSL 인증서 설치 완료
- [ ] (선택) n8n 연동 테스트 완료

---

## 🆘 문제 해결

### 서비스가 시작되지 않음
```bash
sudo journalctl -u image-generator -n 50
# 에러 로그 확인 후 수정

# 수동 실행으로 원인 파악
cd /home/realhun/72놀이터/72-ai-playground/image-generator
source venv/bin/activate
python3 main.py
```

### 포트 충돌
```bash
lsof -i :8004
# PID 확인 후 종료
kill -9 <PID>
sudo systemctl restart image-generator
```

### Nginx 오류
```bash
sudo nginx -t  # 설정 테스트
tail -f /var/log/nginx/error.log  # 에러 로그
```

### 모듈 없음 오류
```bash
cd /home/realhun/72놀이터/72-ai-playground/image-generator
source venv/bin/activate
pip install --upgrade -r requirements.txt
sudo systemctl restart image-generator
```

---

## 📞 지원

- **로그**: `sudo journalctl -u image-generator -f`
- **Health Check**: `http://서버IP:8004/health`
- **API 문서**: `http://서버IP:8004/docs`
- **GitHub**: `https://github.com/ongamemall2675-dot/72-ai-playground`

---

## 🎉 배포 완료!

서버 접속 후 위의 **1️⃣ 단계**만 실행하면 배포 완료됩니다!

```bash
ssh realhun@서버IP
curl -sSL https://raw.githubusercontent.com/ongamemall2675-dot/72-ai-playground/main/image-generator/one-step-deploy.sh | bash
```

그 다음 API 키만 설정하면 끝! 🚀
