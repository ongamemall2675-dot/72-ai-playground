# 🌐 Script Generator 도메인 연결 가이드

## 현재 상태

✅ **Nginx 설정 완료**
- HTTP 설정 완료 (/etc/nginx/sites-enabled/script-generator)
- 포트 80에서 script.hyehwa72.org 리스닝 중
- FastAPI 프록시 설정 완료

✅ **서버 준비 완료**
- Script Generator 서비스 실행 중 (포트 8003)
- Nginx 정상 실행 중
- 서버 IP: 152.42.210.15

❌ **DNS 설정 필요**
- script.hyehwa72.org → 152.42.210.15 A 레코드 추가 필요

---

## 📋 DNS 설정 방법

### 1단계: DNS 관리 페이지 접속

hyehwa72.org 도메인의 DNS 관리 페이지에 접속하세요.
(예: 가비아, 후이즈, AWS Route53, Cloudflare 등)

### 2단계: A 레코드 추가

다음 A 레코드를 추가하세요:

```
Type: A
Name: script
Value: 152.42.210.15
TTL: 3600 (또는 기본값)
```

**또는 전체 도메인으로:**

```
Type: A
Host: script.hyehwa72.org
IP Address: 152.42.210.15
TTL: 3600
```

### 3단계: DNS 전파 확인

DNS 설정 후 5-30분 정도 기다린 후 아래 명령어로 확인:

```bash
# Windows PowerShell
nslookup script.hyehwa72.org

# 또는 온라인 도구 사용
# https://dnschecker.org
```

**정상 응답 예시:**
```
Server: ...
Address: ...

Name:    script.hyehwa72.org
Address: 152.42.210.15
```

---

## 🔒 SSL 인증서 설정 (DNS 설정 후)

DNS가 정상적으로 설정된 후 SSL 인증서를 발급받으세요.

### 1단계: Certbot으로 SSL 인증서 발급

서버에 SSH 접속:

```bash
ssh root@152.42.210.15

# Certbot이 없다면 설치
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# SSL 인증서 발급 (자동 설정)
sudo certbot --nginx -d script.hyehwa72.org

# 또는 수동으로 인증서만 발급
sudo certbot certonly --webroot -w /var/www/html -d script.hyehwa72.org
```

### 2단계: Nginx HTTPS 설정 적용

SSL 인증서 발급 후, HTTPS 설정 파일로 교체:

```bash
# 서버에서 실행
cd /root/script-generator

# HTTPS 설정으로 교체
sudo cp nginx-script-generator.conf /etc/nginx/sites-available/script-generator

# Nginx 설정 테스트
sudo nginx -t

# Nginx 리로드
sudo systemctl reload nginx
```

### 3단계: 자동 갱신 설정 (중요!)

Certbot은 자동 갱신이 설정되어 있지만, 확인:

```bash
# 자동 갱신 테스트
sudo certbot renew --dry-run

# 타이머 확인
sudo systemctl status certbot.timer
```

---

## 🧪 테스트 방법

### DNS 설정 전 (IP로 테스트)

```bash
# 직접 IP로 접속
curl http://152.42.210.15:8003/health

# Nginx 통한 접속 (Host 헤더 지정)
curl -H "Host: script.hyehwa72.org" http://152.42.210.15/health
```

### DNS 설정 후 (도메인으로 테스트)

```bash
# HTTP 접속
curl http://script.hyehwa72.org/health

# 브라우저에서
http://script.hyehwa72.org
```

### SSL 설정 후 (HTTPS 테스트)

```bash
# HTTPS 접속
curl https://script.hyehwa72.org/health

# 인증서 확인
curl -vI https://script.hyehwa72.org
```

---

## 📋 현재 Nginx 설정 파일들

### 1. nginx-script-generator-http.conf (현재 사용 중)
- HTTP만 지원
- SSL 인증서 발급을 위한 Let's Encrypt 경로 포함
- 위치: `/etc/nginx/sites-available/script-generator`

### 2. nginx-script-generator.conf (SSL 설정 후 사용)
- HTTPS 리디렉트 포함
- SSL/TLS 설정 완료
- Let's Encrypt 인증서 경로 지정

---

## 🔧 문제 해결

### DNS가 전파되지 않을 때

```bash
# Windows에서 DNS 캐시 초기화
ipconfig /flushdns

# 다른 DNS 서버로 확인
nslookup script.hyehwa72.org 8.8.8.8
```

### Nginx 에러 발생 시

```bash
# Nginx 로그 확인
ssh root@152.42.210.15 "sudo tail -f /var/log/nginx/script-generator-error.log"

# Nginx 설정 테스트
ssh root@152.42.210.15 "sudo nginx -t"

# Nginx 재시작
ssh root@152.42.210.15 "sudo systemctl restart nginx"
```

### SSL 인증서 발급 실패 시

1. DNS가 정상적으로 설정되었는지 확인
2. 포트 80이 열려 있는지 확인
3. Certbot 로그 확인:
   ```bash
   sudo tail -f /var/log/letsencrypt/letsencrypt.log
   ```

---

## 📊 완료 체크리스트

### 현재 단계
- [x] Script Generator 서비스 실행 중
- [x] Nginx HTTP 설정 완료
- [x] Nginx 정상 실행
- [ ] **DNS A 레코드 설정** ← 현재 단계
- [ ] DNS 전파 확인
- [ ] SSL 인증서 발급
- [ ] HTTPS 설정 적용
- [ ] 도메인 접속 테스트

### DNS 설정 후
- [ ] `nslookup script.hyehwa72.org`로 IP 확인
- [ ] `http://script.hyehwa72.org` 브라우저 접속 테스트
- [ ] SSL 인증서 발급 (Certbot)
- [ ] HTTPS 설정 적용
- [ ] `https://script.hyehwa72.org` 접속 테스트

---

## 🎯 다음 단계

### 즉시 해야 할 일
1. **DNS 관리 페이지에서 A 레코드 추가**
   ```
   script.hyehwa72.org → 152.42.210.15
   ```

2. **DNS 전파 확인** (5-30분 대기)
   ```bash
   nslookup script.hyehwa72.org
   ```

3. **SSL 인증서 발급** (DNS 전파 후)
   ```bash
   ssh root@152.42.210.15
   sudo certbot --nginx -d script.hyehwa72.org
   ```

4. **HTTPS 설정 적용**
   ```bash
   sudo cp /root/script-generator/nginx-script-generator.conf /etc/nginx/sites-available/script-generator
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## 🌐 최종 접속 URL

### HTTP (DNS 설정 후, SSL 전)
```
http://script.hyehwa72.org
http://script.hyehwa72.org/docs (API 문서)
http://script.hyehwa72.org/health (헬스 체크)
```

### HTTPS (SSL 설정 후)
```
https://script.hyehwa72.org
https://script.hyehwa72.org/docs
https://script.hyehwa72.org/health
```

### n8n 웹훅
```
POST https://script.hyehwa72.org/webhook/script
```

---

## 📞 지원

문제가 발생하면:
- Nginx 로그: `sudo tail -f /var/log/nginx/script-generator-error.log`
- 서비스 로그: `sudo journalctl -u script-generator -f`
- Nginx 상태: `sudo systemctl status nginx`

---

**현재 작업 필요:** DNS A 레코드 설정
**위치:** hyehwa72.org 도메인 DNS 관리 페이지
**설정값:** `script.hyehwa72.org → 152.42.210.15`
