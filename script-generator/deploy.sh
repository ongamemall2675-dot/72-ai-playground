#!/bin/bash

# Script Generator 배포 스크립트
# 사용법: ./deploy.sh

set -e

echo "======================================"
echo "Script Generator 배포 시작"
echo "======================================"

# 변수 설정
SERVER_USER="root"
SERVER_HOST="152.42.210.15"
SERVER_DIR="/root/script-generator"
SERVICE_NAME="script-generator"

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[1/6] 서버 연결 테스트...${NC}"
if ssh ${SERVER_USER}@${SERVER_HOST} "echo 'Connection successful'"; then
    echo -e "${GREEN}✓ 서버 연결 성공${NC}"
else
    echo "❌ 서버 연결 실패"
    exit 1
fi

echo -e "${YELLOW}[2/6] 서버 디렉토리 준비...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_DIR}"
echo -e "${GREEN}✓ 디렉토리 생성 완료${NC}"

echo -e "${YELLOW}[3/6] 파일 전송...${NC}"
rsync -avz --exclude='.git' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.env' \
    --exclude='writers.json' \
    --exclude='*.log' \
    ./ ${SERVER_USER}@${SERVER_HOST}:${SERVER_DIR}/
echo -e "${GREEN}✓ 파일 전송 완료${NC}"

echo -e "${YELLOW}[4/6] 의존성 설치...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "cd ${SERVER_DIR} && pip3 install -r requirements.txt"
echo -e "${GREEN}✓ 의존성 설치 완료${NC}"

echo -e "${YELLOW}[5/6] Systemd 서비스 설정...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /root/script-generator

# 서비스 파일 복사
sudo cp script-generator.service /etc/systemd/system/

# Systemd 리로드
sudo systemctl daemon-reload

# 서비스 재시작
if systemctl is-active --quiet script-generator; then
    echo "서비스 재시작 중..."
    sudo systemctl restart script-generator
else
    echo "서비스 시작 중..."
    sudo systemctl enable script-generator
    sudo systemctl start script-generator
fi

# 서비스 상태 확인
sleep 2
sudo systemctl status script-generator --no-pager
ENDSSH
echo -e "${GREEN}✓ Systemd 서비스 설정 완료${NC}"

echo -e "${YELLOW}[6/6] Nginx 설정 (선택사항)...${NC}"
read -p "Nginx 설정을 업데이트하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
cd /root/script-generator

# Nginx 설정 복사
sudo cp nginx-script-generator.conf /etc/nginx/sites-available/

# 심볼릭 링크 생성 (이미 존재하면 무시)
sudo ln -sf /etc/nginx/sites-available/nginx-script-generator.conf /etc/nginx/sites-enabled/

# Nginx 설정 테스트
sudo nginx -t

# Nginx 리로드
sudo systemctl reload nginx

echo "Nginx 설정 완료"
ENDSSH
    echo -e "${GREEN}✓ Nginx 설정 업데이트 완료${NC}"
else
    echo "Nginx 설정 건너뛰기"
fi

echo ""
echo "======================================"
echo -e "${GREEN}배포 완료!${NC}"
echo "======================================"
echo ""
echo "📊 서비스 상태 확인:"
echo "   ssh ${SERVER_USER}@${SERVER_HOST} 'systemctl status ${SERVICE_NAME}'"
echo ""
echo "📝 로그 확인:"
echo "   ssh ${SERVER_USER}@${SERVER_HOST} 'journalctl -u ${SERVICE_NAME} -f'"
echo ""
echo "🌐 접속 URL:"
echo "   http://${SERVER_HOST}:8003"
echo "   https://script.hyehwa72.org (Nginx 설정 시)"
echo ""
