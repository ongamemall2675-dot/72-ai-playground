#!/bin/bash
# 간단한 서버 시작 스크립트 (Port 8004)

cd "$(dirname "$0")"

# 로그 디렉토리 생성
mkdir -p logs

# 가상환경 활성화
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "❌ 가상환경이 없습니다. 먼저 'python3 -m venv venv'를 실행하세요."
    exit 1
fi

# 기존 프로세스 확인
if lsof -Pi :8004 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  포트 8004가 이미 사용 중입니다."
    echo "기존 프로세스를 종료하시겠습니까? (y/n)"
    read -r answer
    if [ "$answer" = "y" ]; then
        pkill -f "uvicorn.*8004"
        sleep 2
    else
        exit 1
    fi
fi

# 서버 시작
echo "🚀 AI 이미지 생성기 시작 (Port 8004)..."
python3 main.py
