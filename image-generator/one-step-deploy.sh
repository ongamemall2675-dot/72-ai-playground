#!/bin/bash
# 🚀 AI 이미지 생성기 - 원스텝 배포 스크립트
# 서버에서 이 파일을 다운로드하여 실행하면 모든 배포가 자동으로 완료됩니다.

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 AI 이미지 생성기 자동 배포"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 설정 변수
REPO_URL="https://github.com/ongamemall2675-dot/72-ai-playground.git"
PROJECT_BASE="/home/realhun/72놀이터"
PROJECT_NAME="72-ai-playground"
PROJECT_DIR="$PROJECT_BASE/$PROJECT_NAME/image-generator"
SERVICE_NAME="image-generator"
PORT=8004
DOMAIN="image-gen.hyehwa72.org"

# 1. 필수 패키지 확인
echo "📦 필수 패키지 확인..."
command -v git >/dev/null 2>&1 || { echo "❌ Git이 설치되지 않았습니다. 설치: sudo apt install git -y"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python3이 설치되지 않았습니다. 설치: sudo apt install python3 python3-venv python3-pip -y"; exit 1; }
command -v nginx >/dev/null 2>&1 || { echo "❌ Nginx가 설치되지 않았습니다. 설치: sudo apt install nginx -y"; exit 1; }
echo "✅ 필수 패키지 확인 완료"

# 2. 프로젝트 디렉토리 설정
echo ""
echo "📁 프로젝트 디렉토리 설정..."
mkdir -p "$PROJECT_BASE"
cd "$PROJECT_BASE"

# 3. Git 클론 또는 업데이트
if [ -d "$PROJECT_NAME" ]; then
    echo "📥 기존 프로젝트 업데이트..."
    cd "$PROJECT_NAME"
    git pull origin main
else
    echo "📥 프로젝트 클론..."
    git clone "$REPO_URL"
fi

cd "$PROJECT_DIR"
echo "✅ 현재 디렉토리: $(pwd)"

# 4. 로그/데이터 디렉토리 생성
echo ""
echo "📂 디렉토리 생성..."
mkdir -p logs data
echo "✅ 디렉토리 생성 완료"

# 5. API 키 확인 또는 생성
echo ""
echo "🔑 API 키 확인..."
if [ ! -f "api_secrets.json" ]; then
    echo "⚠️  api_secrets.json 파일이 없습니다."
    echo "템플릿 파일을 생성합니다..."
    cp api_secrets.json.example api_secrets.json 2>/dev/null || cat > api_secrets.json << 'EOF'
{
  "openai_api_key": "",
  "replicate_api_token": "",
  "gemini_api_key": "",
  "claude_api_key": "",
  "vertex_api_key": ""
}
EOF
    echo ""
    echo "❗ 중요: API 키를 입력해야 합니다!"
    echo "다음 명령으로 API 키를 설정하세요:"
    echo "  nano $PROJECT_DIR/api_secrets.json"
    echo ""
    read -p "지금 API 키를 입력하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        nano api_secrets.json
    else
        echo "⚠️  나중에 반드시 API 키를 설정하세요!"
    fi
else
    echo "✅ api_secrets.json 파일 존재"
fi

# 6. Python 가상환경 설정
echo ""
echo "🐍 Python 가상환경 설정..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ 가상환경 생성 완료"
fi

source venv/bin/activate
echo "✅ 가상환경 활성화"

# 7. 의존성 설치
echo ""
echo "📦 의존성 설치..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "✅ 의존성 설치 완료"

# 8. Systemd 서비스 설정
echo ""
echo "⚙️  Systemd 서비스 설정..."

# 서비스 파일 복사 및 경로 업데이트
sudo cp image-generator.service /etc/systemd/system/
sudo sed -i "s|/home/realhun/72놀이터/image-generator|$PROJECT_DIR|g" /etc/systemd/system/$SERVICE_NAME.service
sudo sed -i "s|User=realhun|User=$USER|g" /etc/systemd/system/$SERVICE_NAME.service

sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
echo "✅ Systemd 서비스 등록 완료"

# 9. Nginx 설정
echo ""
echo "🌐 Nginx 설정..."

# Nginx 설정 파일 복사
sudo cp nginx-config.conf /etc/nginx/sites-available/$SERVICE_NAME

# 도메인 업데이트
sudo sed -i "s|image-gen.hyehwa72.org|$DOMAIN|g" /etc/nginx/sites-available/$SERVICE_NAME

# 심볼릭 링크 생성
if [ ! -L "/etc/nginx/sites-enabled/$SERVICE_NAME" ]; then
    sudo ln -s /etc/nginx/sites-available/$SERVICE_NAME /etc/nginx/sites-enabled/
    echo "✅ Nginx 사이트 활성화"
fi

# Nginx 설정 테스트
if sudo nginx -t; then
    echo "✅ Nginx 설정 검증 성공"
else
    echo "❌ Nginx 설정 오류!"
    exit 1
fi

# 10. 방화벽 설정
echo ""
echo "🔥 방화벽 설정..."
if command -v ufw >/dev/null 2>&1; then
    sudo ufw allow 80/tcp >/dev/null 2>&1 || true
    sudo ufw allow 443/tcp >/dev/null 2>&1 || true
    sudo ufw allow $PORT/tcp >/dev/null 2>&1 || true
    echo "✅ UFW 방화벽 설정 완료"
fi

# 11. 서비스 시작
echo ""
echo "🔄 서비스 시작..."

# 기존 프로세스 정리
sudo systemctl stop $SERVICE_NAME 2>/dev/null || true
pkill -f "main.py" 2>/dev/null || true
sleep 2

# 서비스 시작
sudo systemctl start $SERVICE_NAME
sudo systemctl reload nginx

echo "✅ 서비스 시작 완료"

# 12. 상태 확인
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 배포 상태 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 3

# Systemd 상태
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ Systemd 서비스: 실행 중"
    SERVICE_STATUS="✅"
else
    echo "❌ Systemd 서비스: 중지됨"
    echo "   로그 확인: sudo journalctl -u $SERVICE_NAME -n 50"
    SERVICE_STATUS="❌"
fi

# Nginx 상태
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx: 실행 중"
    NGINX_STATUS="✅"
else
    echo "❌ Nginx: 중지됨"
    NGINX_STATUS="❌"
fi

# 포트 확인
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ 포트 $PORT: 리스닝 중"
    PORT_STATUS="✅"
else
    echo "⚠️  포트 $PORT: 리스닝 안됨"
    PORT_STATUS="⚠️"
fi

# Health Check
echo ""
echo "🏥 Health Check..."
sleep 2
if curl -s http://localhost:$PORT/health | grep -q "healthy"; then
    echo "✅ API Health Check: 정상"
    HEALTH_STATUS="✅"
else
    echo "⚠️  API Health Check: 응답 없음"
    HEALTH_STATUS="⚠️"
fi

# 13. 배포 완료 정보
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 배포 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 접속 정보:"
echo "   • 도메인: http://$DOMAIN"
echo "   • 직접 접속: http://$(hostname -I | awk '{print $1}'):$PORT"
echo "   • Health Check: http://$DOMAIN/health"
echo "   • API 문서: http://$DOMAIN/docs"
echo ""
echo "📊 서비스 상태:"
echo "   • Systemd: $SERVICE_STATUS"
echo "   • Nginx: $NGINX_STATUS"
echo "   • Port $PORT: $PORT_STATUS"
echo "   • Health: $HEALTH_STATUS"
echo ""
echo "📝 유용한 명령어:"
echo "   • 로그 확인: sudo journalctl -u $SERVICE_NAME -f"
echo "   • 서비스 재시작: sudo systemctl restart $SERVICE_NAME"
echo "   • 서비스 중지: sudo systemctl stop $SERVICE_NAME"
echo "   • Nginx 재로드: sudo systemctl reload nginx"
echo "   • 상태 확인: sudo systemctl status $SERVICE_NAME"
echo ""
echo "🔐 SSL 인증서 설치 (HTTPS):"
echo "   sudo apt install certbot python3-certbot-nginx -y"
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""
echo "🔗 n8n 연동:"
echo "   • 문서: cat N8N_INTEGRATION.md"
echo "   • Webhook URL: http://$DOMAIN/webhook/image/generate"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 배포 결과 로그 저장
cat > "$PROJECT_DIR/logs/deploy-$(date +%Y%m%d-%H%M%S).log" << EOF
배포 완료: $(date)
Repository: $REPO_URL
Project Directory: $PROJECT_DIR
Port: $PORT
Domain: $DOMAIN
Service Status: $SERVICE_STATUS
Nginx Status: $NGINX_STATUS
Port Status: $PORT_STATUS
Health Status: $HEALTH_STATUS
EOF

echo ""
echo "✅ 배포 로그 저장: $PROJECT_DIR/logs/deploy-$(date +%Y%m%d-%H%M%S).log"
echo ""
