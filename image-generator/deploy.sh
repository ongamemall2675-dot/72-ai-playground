#!/bin/bash
# AI 이미지 생성기 배포 스크립트 (Port 8004)

echo "🚀 AI 이미지 생성기 배포 시작 (Port 8004)..."

# 프로젝트 디렉토리로 이동
cd /home/realhun/72놀이터/image-generator || exit

# Git pull (GitHub 사용 시)
# git pull origin main

# 가상환경 활성화
if [ ! -d "venv" ]; then
    echo "📦 가상환경 생성 중..."
    python3 -m venv venv
fi

source venv/bin/activate

# 의존성 설치
echo "📦 의존성 설치 중..."
pip install --upgrade pip
pip install -r requirements.txt

# 기존 프로세스 종료
echo "🛑 기존 프로세스 종료 중..."
pkill -f "uvicorn.*8004" || true
sleep 2

# 서버 실행 (백그라운드)
echo "✅ 서버 실행 중 (Port 8004)..."
nohup python3 main.py > logs/app.log 2>&1 &

echo "✅ 배포 완료!"
echo "📝 로그 확인: tail -f logs/app.log"
echo "🌐 접속 주소: http://서버IP:8004"
