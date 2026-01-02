# 🚀 배포 및 업데이트 관리 - 빠른 가이드

## 📋 현재 상태

### ❌ 자동 배포 없음 (기본)
```
GitHub 푸시 → ❌ 서버에 자동 반영 안됨
```

### ✅ 자동 배포 설정 가능 (GitHub Actions)
```
GitHub 푸시 → ✅ 자동으로 서버에 배포
```

---

## 🔄 업데이트 방법

### 방법 1: 수동 배포 (현재 방식)

**로컬 → GitHub:**
```bash
git add .
git commit -m "Update: 기능 개선"
git push origin main
```

**서버 업데이트:**
```bash
ssh root@152.42.210.15
cd /root/script-generator
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart script-generator
```

---

### 방법 2: 자동 배포 (GitHub Actions) ⭐ 권장

#### 설정 단계

**1. GitHub Secrets 설정**

GitHub 저장소 → Settings → Secrets and variables → Actions

추가할 Secrets:
- `SERVER_HOST`: `152.42.210.15`
- `SERVER_USER`: `root`
- `SSH_PRIVATE_KEY`: SSH 개인키 전체 내용

**2. SSH 키 생성 및 등록**

```bash
# 로컬에서 SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "github-actions"
# 저장 위치: C:\Users\ongam\.ssh\github_actions_rsa

# 공개키를 서버에 등록
ssh root@152.42.210.15
cat >> ~/.ssh/authorized_keys
# 공개키 내용 붙여넣기 (github_actions_rsa.pub)
# Ctrl+D로 저장

# 개인키를 GitHub Secret에 등록
# github_actions_rsa 파일 내용 전체 복사
# GitHub Secrets에 SSH_PRIVATE_KEY로 등록
```

**3. 완료!**

이제부터 GitHub에 푸시하면 자동으로 서버에 배포됩니다!

---

## 🎯 사용 방법

### 자동 배포 (설정 후)

```bash
# 1. 코드 수정
# 2. GitHub에 푸시
git add .
git commit -m "Update: 새 기능 추가"
git push origin main

# 3. 자동 배포 시작! (약 1-2분 소요)
# 4. GitHub → Actions 탭에서 진행 상황 확인
```

### 배포 확인

**GitHub에서:**
- 저장소 → Actions 탭 → 최근 워크플로우 확인

**서버에서:**
```bash
ssh root@152.42.210.15
sudo systemctl status script-generator
sudo systemctl status image-generator
```

---

## 📂 프로젝트별 배포

### Script Generator (포트 8003)
- **폴더**: `script-generator/`
- **트리거**: `script-generator/` 폴더 변경 시
- **서버 경로**: `/root/script-generator`

### Image Generator (포트 8004)
- **폴더**: `image-generator/`
- **트리거**: `image-generator/` 폴더 변경 시
- **서버 경로**: `/home/realhun/72놀이터/72-ai-playground/image-generator`

---

## ⚠️ 주의사항

### 1. 민감한 정보 보호
```
❌ API 키, 비밀번호를 GitHub에 푸시하지 마세요!
✅ .gitignore에 추가되어 있는지 확인:
   - .env
   - api_secrets.json
   - *.key
```

### 2. 배포 시간
- 배포 중 약 5-10초간 서비스 중단
- 트래픽이 적은 시간에 배포 권장

### 3. 롤백 방법
```bash
# 이전 버전으로 되돌리기
ssh root@152.42.210.15
cd /root/script-generator
git log --oneline  # 커밋 ID 확인
git reset --hard <이전_커밋ID>
sudo systemctl restart script-generator
```

---

## 🔍 배포 프로세스

```
1. 로컬에서 코드 수정
   ↓
2. GitHub에 푸시
   ↓
3. GitHub Actions 자동 실행
   ↓
4. 서버에 SSH 접속
   ↓
5. git pull (최신 코드)
   ↓
6. pip install (의존성 업데이트)
   ↓
7. systemctl restart (서비스 재시작)
   ↓
8. 배포 완료! ✅
```

---

## 💡 베스트 프랙티스

### 커밋 메시지 규칙
```
Add: 새 기능 추가
Fix: 버그 수정
Update: 기능 개선
Refactor: 코드 리팩토링
Docs: 문서 수정
```

### 배포 전 체크리스트
- [ ] 로컬에서 테스트 완료
- [ ] 민감한 정보 제거 확인
- [ ] 커밋 메시지 작성
- [ ] GitHub Actions 로그 확인

---

## 📞 문제 해결

### 배포 실패 시
1. **GitHub Actions 로그 확인**
   - 저장소 → Actions → 실패한 워크플로우 클릭

2. **SSH 키 확인**
   - GitHub Secrets에 올바른 개인키 등록 확인

3. **서버 로그 확인**
   ```bash
   ssh root@152.42.210.15
   sudo journalctl -u script-generator -n 50
   ```

---

## 🎉 요약

### 현재 (수동 배포)
```
코드 수정 → GitHub 푸시 → SSH 접속 → git pull → 재시작
```

### 자동 배포 설정 후
```
코드 수정 → GitHub 푸시 → ✨ 끝! (자동 배포)
```

**자동 배포 설정 파일:**
- `.github/workflows/deploy-script-generator.yml`
- `.github/workflows/deploy-image-generator.yml`
- `.github/workflows/README.md` (상세 가이드)

**설정만 하면 앞으로는 GitHub 푸시만으로 배포 완료!** 🚀
