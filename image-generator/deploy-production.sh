#!/bin/bash
# AI 이미지 생성기 프로덕션 배포 스크립트
# Nginx + Systemd + GitHub 조합

set -e  # 에러 발생 시 즉시 중단

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 AI 이미지 생성기 프로덕션 배포 시작"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 설정
PROJECT_DIR="/home/realhun/72놀이터/image-generator"
SERVICE_NAME="image-generator"
NGINX_SITE="image-generator"
DOMAIN="image-gen.hyehwa72.org"  # 도메인 수정 필요

# 1. 프로젝트 디렉토리로 이동
echo ""
echo "📁 프로젝트 디렉토리: $PROJECT_DIR"
cd "$PROJECT_DIR" || exit 1

# 2. Git pull (최신 코드 가져오기)
echo ""
echo "📥 최신 코드 가져오기..."
if [ -d ".git" ]; then
    git pull origin main
    echo "✅ Git pull 완료"
else
    echo "⚠️  Git 저장소가 아닙니다. 수동으로 업로드된 파일 사용"
fi

# 3. 로그 디렉토리 생성
echo ""
echo "📂 로그 디렉토리 생성..."
mkdir -p logs
mkdir -p data
echo "✅ 디렉토리 생성 완료"

# 4. 가상환경 설정
echo ""
echo "🐍 Python 가상환경 설정..."
if [ ! -d "venv" ]; then
    echo "  → 가상환경 생성 중..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "✅ 가상환경 활성화 완료"

# 5. 의존성 설치
echo ""
echo "📦 의존성 설치 중..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "✅ 의존성 설치 완료"

# 6. API 키 확인
echo ""
echo "🔑 API 키 확인..."
if [ -f "api_secrets.json" ]; then
    echo "✅ api_secrets.json 파일 존재"
else
    echo "❌ api_secrets.json 파일이 없습니다!"
    echo ""
    echo "다음 명령으로 생성하세요:"
    echo "nano api_secrets.json"
    echo ""
    echo "예시 내용:"
    echo '{'
    echo '  "openai_api_key": "sk-.....",'
    echo '  "replicate_api_token": "r8_.....",'
    echo '  "gemini_api_key": "AIza.....",'
    echo '  "claude_api_key": "sk-ant-.....",'
    echo '  "vertex_api_key": "AIza....."'
    echo '}'
    exit 1
fi

# 7. Systemd 서비스 설정
echo ""
echo "⚙️  Systemd 서비스 설정..."

# 서비스 파일에서 경로 업데이트
sudo cp image-generator.service /etc/systemd/system/
sudo sed -i "s|/home/realhun/72놀이터/image-generator|$PROJECT_DIR|g" /etc/systemd/system/image-generator.service

sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
echo "✅ Systemd 서비스 등록 완료"

# 8. Nginx 설정
echo ""
echo "🌐 Nginx 설정..."

# Nginx 설정 파일 복사
sudo cp nginx-config.conf /etc/nginx/sites-available/$NGINX_SITE

# 도메인 업데이트 (필요시)
sudo sed -i "s|image-gen.hyehwa72.org|$DOMAIN|g" /etc/nginx/sites-available/$NGINX_SITE

# 심볼릭 링크 생성
if [ ! -L "/etc/nginx/sites-enabled/$NGINX_SITE" ]; then
    sudo ln -s /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/
    echo "✅ Nginx 사이트 활성화"
fi

# Nginx 설정 테스트
echo ""
echo "🔍 Nginx 설정 검증 중..."
if sudo nginx -t; then
    echo "✅ Nginx 설정 올바름"
else
    echo "❌ Nginx 설정 오류! 배포 중단"
    exit 1
fi

# 9. 서비스 시작
echo ""
echo "🔄 서비스 재시작 중..."

# 기존 서비스 중지
sudo systemctl stop $SERVICE_NAME 2>/dev/null || true
sleep 2

# 서비스 시작
sudo systemctl start $SERVICE_NAME

# Nginx 재로드
sudo systemctl reload nginx

echo "✅ 서비스 시작 완료"

# 10. 상태 확인
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 서비스 상태 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Systemd 상태
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ Systemd 서비스: 실행 중"
else
    echo "❌ Systemd 서비스: 중지됨"
    echo ""
    echo "로그 확인:"
    echo "sudo journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

# Nginx 상태
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx: 실행 중"
else
    echo "❌ Nginx: 중지됨"
fi

# 포트 확인
if lsof -Pi :8004 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ 포트 8004: 리스닝 중"
else
    echo "⚠️  포트 8004: 리스닝 안됨"
fi

# 11. 접속 정보
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 배포 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 접속 주소:"
echo "   • 도메인: http://$DOMAIN"
echo "   • 직접 접속: http://서버IP:8004"
echo "   • Health Check: http://$DOMAIN/health"
echo ""
echo "📝 유용한 명령어:"
echo "   • 로그 확인: sudo journalctl -u $SERVICE_NAME -f"
echo "   • 서비스 재시작: sudo systemctl restart $SERVICE_NAME"
echo "   • 서비스 중지: sudo systemctl stop $SERVICE_NAME"
echo "   • Nginx 재로드: sudo systemctl reload nginx"
echo ""
echo "🔐 SSL 인증서 설치 (선택):"
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
