# AI 이미지 생성기 배포 가이드

## 포트 정보
- **서비스 포트**: 8004
- **접속 주소**: `http://서버IP:8004`

## 배포 방법 선택

### 방법 1: GitHub 사용 (권장) ⭐
**장점:**
- ✅ 코드 버전 관리 가능
- ✅ 여러 서버에 쉽게 배포
- ✅ 변경 이력 추적 가능
- ✅ 협업 용이

**단점:**
- ❌ `.gitignore` 관리 필요 (API 키 보호)
- ❌ GitHub 설정 필요

### 방법 2: 로컬 배포
**장점:**
- ✅ 간단하고 빠름
- ✅ 네트워크 불필요

**단점:**
- ❌ 버전 관리 어려움
- ❌ 백업이 까다로움
- ❌ 여러 서버 배포 시 번거로움

---

## 🚀 배포 방법

### A. GitHub 배포 (권장)

#### 1단계: GitHub 저장소 준비
```bash
cd "C:\Users\ongam\antigravity project\홈페이지작업\혜화72부동산 홈페이지\72놀이터\image-generator"

# .gitignore 확인 (api_secrets.json이 포함되어 있는지 확인)
cat .gitignore

# Git 초기화 (아직 안했다면)
git init
git add .
git commit -m "Initial commit: AI Image Generator"

# GitHub 저장소 연결 (GitHub에서 저장소 생성 후)
git remote add origin https://github.com/your-username/image-generator.git
git branch -M main
git push -u origin main
```

#### 2단계: 서버에서 클론 및 설정
```bash
# SSH로 서버 접속
ssh realhun@서버IP

# 프로젝트 디렉토리로 이동
cd /home/realhun/72놀이터

# GitHub에서 클론
git clone https://github.com/your-username/image-generator.git
cd image-generator

# 가상환경 생성 및 의존성 설치
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# API 키 설정 (중요!)
nano api_secrets.json
# 아래 내용을 입력 후 저장 (Ctrl+X, Y, Enter)
```

**api_secrets.json 예시:**
```json
{
  "openai_api_key": "sk-...",
  "replicate_api_token": "r8_...",
  "gemini_api_key": "AIza...",
  "claude_api_key": "sk-ant-...",
  "vertex_api_key": "AIza..."
}
```

#### 3단계: Systemd 서비스 등록 (자동 시작)
```bash
# 서비스 파일 복사
sudo cp image-generator.service /etc/systemd/system/

# 서비스 파일 수정 (경로 확인)
sudo nano /etc/systemd/system/image-generator.service
# User와 WorkingDirectory 경로를 실제 경로로 수정

# 서비스 활성화
sudo systemctl daemon-reload
sudo systemctl enable image-generator
sudo systemctl start image-generator

# 상태 확인
sudo systemctl status image-generator
```

#### 4단계: 업데이트 방법
```bash
cd /home/realhun/72놀이터/image-generator
git pull origin main
sudo systemctl restart image-generator
```

---

### B. 로컬 파일 배포 (간단)

#### 1단계: 파일 업로드
로컬 PC에서 서버로 파일 전송:
```bash
# PowerShell에서 실행
scp -r "C:\Users\ongam\antigravity project\홈페이지작업\혜화72부동산 홈페이지\72놀이터\image-generator" realhun@서버IP:/home/realhun/72놀이터/
```

또는 **FileZilla**, **WinSCP** 같은 FTP 클라이언트 사용

#### 2단계: 서버에서 설정
```bash
# SSH로 서버 접속
ssh realhun@서버IP

cd /home/realhun/72놀이터/image-generator

# 가상환경 생성
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# API 키가 api_secrets.json에 있는지 확인
cat api_secrets.json

# 실행 권한 부여
chmod +x start.sh deploy.sh

# 서버 시작
./start.sh
```

---

## 🔧 서버 관리 명령어

### Systemd 서비스 사용 시
```bash
# 시작
sudo systemctl start image-generator

# 중지
sudo systemctl stop image-generator

# 재시작
sudo systemctl restart image-generator

# 상태 확인
sudo systemctl status image-generator

# 로그 확인
sudo journalctl -u image-generator -f

# 자동 시작 활성화
sudo systemctl enable image-generator

# 자동 시작 비활성화
sudo systemctl disable image-generator
```

### 수동 실행 시
```bash
# 시작
./start.sh

# 백그라운드 실행
nohup python3 main.py > logs/app.log 2>&1 &

# 프로세스 확인
ps aux | grep main.py

# 종료
pkill -f "main.py"

# 로그 확인
tail -f logs/app.log
```

---

## 🌐 Nginx 리버스 프록시 설정 (선택사항)

도메인으로 접속하려면 Nginx 설정:

```nginx
# /etc/nginx/sites-available/image-generator
server {
    listen 80;
    server_name image-gen.hyehwa72.org;  # 도메인 변경

    location / {
        proxy_pass http://127.0.0.1:8004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

설정 후:
```bash
sudo ln -s /etc/nginx/sites-available/image-generator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 방화벽 설정

포트 8004 열기:
```bash
# UFW 사용 시
sudo ufw allow 8004/tcp
sudo ufw reload

# firewalld 사용 시
sudo firewall-cmd --permanent --add-port=8004/tcp
sudo firewall-cmd --reload
```

---

## 📝 체크리스트

배포 전 확인사항:
- [ ] `api_secrets.json` 파일에 API 키 설정
- [ ] `requirements.txt` 의존성 설치 완료
- [ ] 포트 8004 방화벽 개방
- [ ] 로그 디렉토리 생성 (`mkdir -p logs`)
- [ ] Python 3.8 이상 설치 확인

---

## 🆘 트러블슈팅

### 포트 충돌
```bash
# 8004 포트 사용 중인 프로세스 확인
lsof -i :8004
# 또는
netstat -tulpn | grep 8004

# 프로세스 종료
kill -9 <PID>
```

### 모듈 없음 에러
```bash
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

### 권한 문제
```bash
chmod +x start.sh deploy.sh
chmod 644 api_secrets.json
```

---

## 📊 현재 설정

- **포트**: 8004
- **호스트**: 0.0.0.0 (모든 인터페이스)
- **Python 버전**: 3.8+
- **주요 의존성**:
  - FastAPI
  - Uvicorn
  - Replicate
  - Google Generative AI
  - httpx

---

## 💡 권장 사항

**프로덕션 환경에는 GitHub 배포 + Systemd + Nginx 조합을 권장합니다.**

이유:
1. 코드 버전 관리 및 롤백 가능
2. 서버 재부팅 시 자동 시작
3. SSL/HTTPS 적용 가능
4. 도메인 연결 용이
