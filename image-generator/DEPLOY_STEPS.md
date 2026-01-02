# 🚀 프로덕션 배포 가이드 (Nginx + Systemd + GitHub)

## 배포 개요
- **서비스 포트**: 8004 (내부)
- **도메인**: image-gen.hyehwa72.org (또는 원하는 도메인)
- **서버 경로**: /home/realhun/72놀이터/image-generator
- **자동 시작**: Systemd 서비스로 등록

---

## 📋 사전 준비

### 1. 서버 요구사항
- Ubuntu/Debian 기반 Linux
- Python 3.8 이상
- Nginx 설치됨
- Git 설치됨
- sudo 권한

### 2. 도메인 설정
DNS에서 A 레코드 추가:
```
image-gen.hyehwa72.org → 서버 IP
```

---

## 🎯 배포 단계

### STEP 1: 로컬에서 GitHub에 코드 푸시

```powershell
# PowerShell (Windows)
cd "C:\Users\ongam\antigravity project\홈페이지작업\혜화72부동산 홈페이지\72놀이터\image-generator"

# Git 상태 확인
git status

# GitHub에 푸시
git add .
git commit -m "Production deployment - AI Image Generator v2.6"
git push origin main
```

---

### STEP 2: 서버 접속 및 클론

```bash
# SSH로 서버 접속
ssh realhun@서버IP

# 프로젝트 디렉토리로 이동
cd /home/realhun/72놀이터

# GitHub에서 클론 (처음 배포 시)
git clone https://github.com/your-username/image-generator.git

# 디렉토리 이동
cd image-generator
```

---

### STEP 3: API 키 설정 (중요!)

```bash
# api_secrets.json 파일 생성
nano api_secrets.json
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

저장: `Ctrl + X` → `Y` → `Enter`

---

### STEP 4: 도메인 설정 (nginx-config.conf)

```bash
# 도메인 수정
nano nginx-config.conf
```

`server_name` 부분을 원하는 도메인으로 변경:
```nginx
server_name image-gen.hyehwa72.org;  # 여기를 수정
```

또는 배포 스크립트에서 자동으로 변경됩니다.

---

### STEP 5: 배포 스크립트 실행

```bash
# 실행 권한 부여
chmod +x deploy-production.sh

# 배포 실행
./deploy-production.sh
```

이 스크립트는 자동으로:
1. ✅ Git pull로 최신 코드 가져오기
2. ✅ 가상환경 생성 및 의존성 설치
3. ✅ Systemd 서비스 등록
4. ✅ Nginx 설정 및 활성화
5. ✅ 서비스 시작
6. ✅ 상태 확인

---

### STEP 6: SSL 인증서 설치 (HTTPS)

```bash
# Certbot 설치 (Ubuntu/Debian)
sudo apt install certbot python3-certbot-nginx -y

# SSL 인증서 발급 및 자동 설정
sudo certbot --nginx -d image-gen.hyehwa72.org

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

---

## ✅ 배포 완료 확인

### 1. 서비스 상태 확인
```bash
# Systemd 서비스 상태
sudo systemctl status image-generator

# Nginx 상태
sudo systemctl status nginx

# 포트 확인
lsof -i :8004
```

### 2. 로그 확인
```bash
# 실시간 로그
sudo journalctl -u image-generator -f

# 최근 100줄
sudo journalctl -u image-generator -n 100

# Nginx 로그
tail -f /var/log/nginx/image-generator-access.log
tail -f /var/log/nginx/image-generator-error.log
```

### 3. Health Check
```bash
# 직접 접속 테스트
curl http://localhost:8004/health

# Nginx를 통한 접속 테스트
curl http://image-gen.hyehwa72.org/health
```

브라우저에서:
- `http://image-gen.hyehwa72.org`
- `http://image-gen.hyehwa72.org/health`

---

## 🔄 업데이트 방법

코드 변경 후:

```bash
# SSH로 서버 접속
ssh realhun@서버IP

# 프로젝트 디렉토리
cd /home/realhun/72놀이터/image-generator

# 최신 코드 가져오기
git pull origin main

# 서비스 재시작
sudo systemctl restart image-generator

# 상태 확인
sudo systemctl status image-generator
```

또는 배포 스크립트 재실행:
```bash
./deploy-production.sh
```

---

## 🛠️ 관리 명령어

### 서비스 제어
```bash
# 시작
sudo systemctl start image-generator

# 중지
sudo systemctl stop image-generator

# 재시작
sudo systemctl restart image-generator

# 상태 확인
sudo systemctl status image-generator

# 자동 시작 활성화
sudo systemctl enable image-generator

# 자동 시작 비활성화
sudo systemctl disable image-generator
```

### Nginx 제어
```bash
# 설정 테스트
sudo nginx -t

# 재로드 (다운타임 없음)
sudo systemctl reload nginx

# 재시작
sudo systemctl restart nginx

# 상태 확인
sudo systemctl status nginx
```

### 로그 관리
```bash
# 실시간 로그
sudo journalctl -u image-generator -f

# 날짜별 로그
sudo journalctl -u image-generator --since "2026-01-02"

# 로그 삭제 (디스크 공간 확보)
sudo journalctl --vacuum-time=7d  # 7일 이상 된 로그 삭제
```

---

## 🔧 트러블슈팅

### 문제 1: 서비스가 시작되지 않음
```bash
# 로그 확인
sudo journalctl -u image-generator -n 100

# 수동 실행으로 에러 확인
cd /home/realhun/72놀이터/image-generator
source venv/bin/activate
python3 main.py
```

### 문제 2: 포트 충돌
```bash
# 8004 포트 사용 프로세스 확인
lsof -i :8004

# 프로세스 종료
kill -9 <PID>
```

### 문제 3: Nginx 접속 안됨
```bash
# Nginx 설정 테스트
sudo nginx -t

# Nginx 에러 로그
tail -f /var/log/nginx/error.log

# 방화벽 확인
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 문제 4: API 키 오류
```bash
# api_secrets.json 확인
cat api_secrets.json

# 권한 확인
ls -la api_secrets.json

# 수정
nano api_secrets.json
```

### 문제 5: 모듈 없음 에러
```bash
cd /home/realhun/72놀이터/image-generator
source venv/bin/activate
pip install --upgrade -r requirements.txt
sudo systemctl restart image-generator
```

---

## 📊 모니터링

### 시스템 리소스 확인
```bash
# CPU/메모리 사용량
htop

# 특정 프로세스 확인
ps aux | grep python

# 디스크 사용량
df -h

# 네트워크 연결
netstat -tulpn | grep 8004
```

### 성능 모니터링
```bash
# 요청 수 확인 (Nginx)
tail -f /var/log/nginx/image-generator-access.log | grep POST

# 응답 시간 분석
tail -f /var/log/nginx/image-generator-access.log | awk '{print $NF}'
```

---

## 🔐 보안 체크리스트

- [ ] api_secrets.json 파일 권한 확인 (644 또는 600)
- [ ] .gitignore에 api_secrets.json 포함 확인
- [ ] SSH 키 기반 인증 사용
- [ ] 방화벽 설정 (UFW 또는 firewalld)
- [ ] SSL 인증서 설치 (HTTPS)
- [ ] Fail2ban 설정 (선택)
- [ ] 정기 백업 설정

---

## 📞 지원

문제 발생 시:
1. 로그 확인: `sudo journalctl -u image-generator -n 100`
2. 서비스 상태: `sudo systemctl status image-generator`
3. Nginx 상태: `sudo nginx -t && sudo systemctl status nginx`

---

## 🎉 배포 완료!

접속 주소:
- **HTTP**: http://image-gen.hyehwa72.org
- **HTTPS**: https://image-gen.hyehwa72.org (SSL 설치 후)
- **Health Check**: http://image-gen.hyehwa72.org/health
- **API Docs**: http://image-gen.hyehwa72.org/docs (FastAPI 자동 문서)
