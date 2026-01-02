# GitHub Actions 자동 배포 설정

## 📋 개요

GitHub에 코드를 푸시하면 자동으로 서버에 배포되는 CI/CD 파이프라인입니다.

---

## 🔧 설정 방법

### 1단계: GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

다음 3개의 Secret을 추가하세요:

#### 1. `SERVER_HOST`
```
152.42.210.15
```

#### 2. `SERVER_USER`
```
root
```

#### 3. `SSH_PRIVATE_KEY`

**로컬에서 SSH 키 생성 (아직 없다면):**

```bash
# Windows PowerShell
ssh-keygen -t rsa -b 4096 -C "github-actions"
# 파일명: C:\Users\ongam\.ssh\github_actions_rsa
# 비밀번호: 엔터 (비밀번호 없음)
```

**공개키를 서버에 등록:**

```bash
# 공개키 내용 복사
cat C:\Users\ongam\.ssh\github_actions_rsa.pub

# 서버에 SSH 접속
ssh root@152.42.210.15

# 공개키 등록
echo "복사한_공개키_내용" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**개인키를 GitHub Secret에 등록:**

```bash
# 개인키 내용 복사 (전체 내용)
cat C:\Users\ongam\.ssh\github_actions_rsa

# GitHub Secrets에 SSH_PRIVATE_KEY로 등록
# -----BEGIN OPENSSH PRIVATE KEY----- 부터
# -----END OPENSSH PRIVATE KEY----- 까지 전체 복사
```

---

## 🚀 사용 방법

### 자동 배포 (권장)

```bash
# 1. 코드 수정
# 2. GitHub에 푸시
git add .
git commit -m "Update: 기능 개선"
git push origin main

# 3. GitHub Actions가 자동으로 배포 시작!
# 4. GitHub 저장소 → Actions 탭에서 진행 상황 확인
```

### 수동 배포 트리거

GitHub 저장소 → Actions → 원하는 워크플로우 → Run workflow

---

## 📂 워크플로우 목록

### 1. `deploy-script-generator.yml`
- **트리거**: `script-generator/` 폴더 변경 시
- **배포 대상**: Script Generator (포트 8003)
- **서버 경로**: `/root/script-generator`

### 2. `deploy-image-generator.yml`
- **트리거**: `image-generator/` 폴더 변경 시
- **배포 대상**: Image Generator (포트 8004)
- **서버 경로**: `/home/realhun/72놀이터/72-ai-playground/image-generator`

---

## 🔍 배포 프로세스

```
1. GitHub에 코드 푸시
   ↓
2. GitHub Actions 트리거
   ↓
3. 서버에 SSH 접속
   ↓
4. git pull (최신 코드 가져오기)
   ↓
5. pip install (의존성 업데이트)
   ↓
6. systemctl restart (서비스 재시작)
   ↓
7. 배포 완료!
```

---

## 📊 배포 상태 확인

### GitHub에서 확인
- 저장소 → Actions 탭
- 각 워크플로우 실행 기록 확인
- 로그에서 배포 성공/실패 확인

### 서버에서 확인
```bash
# SSH 접속
ssh root@152.42.210.15

# Script Generator 상태
sudo systemctl status script-generator

# Image Generator 상태
sudo systemctl status image-generator

# 로그 확인
sudo journalctl -u script-generator -n 50
sudo journalctl -u image-generator -n 50
```

---

## ⚠️ 주의사항

### 1. 민감한 정보 보호
- API 키, 비밀번호 등은 **절대 GitHub에 푸시하지 마세요**
- `.gitignore`에 추가되어 있는지 확인:
  ```
  .env
  api_secrets.json
  *.key
  ```

### 2. 서비스 재시작 시간
- 배포 중 약 5-10초간 서비스 중단
- 트래픽이 적은 시간에 배포 권장

### 3. 롤백 방법
```bash
# 서버에서 이전 커밋으로 롤백
cd /root/script-generator
git log --oneline  # 커밋 ID 확인
git reset --hard <커밋ID>
sudo systemctl restart script-generator
```

---

## 🔄 업데이트 시나리오

### 시나리오 1: 코드만 수정
```bash
git add script-generator/main.py
git commit -m "Fix: 버그 수정"
git push origin main
# → 자동 배포됨
```

### 시나리오 2: 의존성 추가
```bash
# requirements.txt 수정
git add script-generator/requirements.txt
git commit -m "Add: 새 패키지 추가"
git push origin main
# → 자동으로 pip install 실행됨
```

### 시나리오 3: 설정 파일 변경
```bash
# Systemd 서비스 파일 수정
git add script-generator/script-generator.service
git commit -m "Update: 환경변수 추가"
git push origin main
# → 수동으로 서비스 파일 복사 필요
ssh root@152.42.210.15
cd /root/script-generator
sudo cp script-generator.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart script-generator
```

---

## 🎯 베스트 프랙티스

### 1. 커밋 메시지 규칙
```
Add: 새 기능 추가
Fix: 버그 수정
Update: 기능 개선
Refactor: 코드 리팩토링
Docs: 문서 수정
Style: 코드 스타일 변경
```

### 2. 브랜치 전략
```
main (프로덕션) ← 자동 배포
  ↑
develop (개발) ← 테스트 후 main에 머지
  ↑
feature/* (기능 개발)
```

### 3. 배포 전 체크리스트
- [ ] 로컬에서 테스트 완료
- [ ] 민감한 정보 제거 확인
- [ ] 커밋 메시지 작성
- [ ] GitHub Actions 로그 확인

---

## 💡 추가 기능

### Slack 알림 추가 (선택사항)

배포 성공/실패 시 Slack으로 알림:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Script Generator 배포 완료!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 배포 승인 프로세스 (선택사항)

배포 전 수동 승인 필요:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      # GitHub Settings → Environments에서 승인자 설정
```

---

## 📞 문제 해결

### 배포 실패 시
1. GitHub Actions 로그 확인
2. SSH 키 권한 확인
3. 서버 디스크 공간 확인
4. 서비스 로그 확인

### 자주 발생하는 오류

**1. Permission denied (publickey)**
→ SSH 키가 올바르게 설정되지 않음

**2. git pull failed**
→ 서버에서 수동으로 변경한 파일이 있음
```bash
git stash  # 변경사항 임시 저장
git pull
```

**3. Service restart failed**
→ 코드에 오류가 있음
```bash
sudo journalctl -u script-generator -n 50
```

---

**자동 배포 설정 완료 후:**
- ✅ GitHub 푸시 → 자동 배포
- ✅ 배포 상태 실시간 확인
- ✅ 롤백 가능
- ✅ 안전한 배포 프로세스
