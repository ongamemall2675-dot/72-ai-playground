@echo off
REM Script Generator Windows 배포 스크립트

echo ======================================
echo Script Generator 서버 배포
echo ======================================
echo.

REM 서버 정보
set SERVER_USER=root
set SERVER_HOST=152.42.210.15
set SERVER_DIR=/root/script-generator
set LOCAL_DIR=%~dp0

echo [1/4] Git에서 최신 코드 가져오기...
git pull origin main
if errorlevel 1 (
    echo Git pull 실패
    pause
    exit /b 1
)
echo OK
echo.

echo [2/4] 서버에 디렉토리 생성...
plink -batch %SERVER_USER%@%SERVER_HOST% "mkdir -p %SERVER_DIR%"
if errorlevel 1 (
    echo 서버 연결 실패
    pause
    exit /b 1
)
echo OK
echo.

echo [3/4] 파일 전송 (pscp 사용)...
pscp -r -batch ^
    main.py ^
    __init__.py ^
    requirements.txt ^
    script-generator.service ^
    nginx-script-generator.conf ^
    .env.example ^
    templates ^
    %SERVER_USER%@%SERVER_HOST%:%SERVER_DIR%/
if errorlevel 1 (
    echo 파일 전송 실패
    pause
    exit /b 1
)
echo OK
echo.

echo [4/4] 서버에서 배포 스크립트 실행...
plink -batch %SERVER_USER%@%SERVER_HOST% "cd %SERVER_DIR% && pip3 install -r requirements.txt && sudo cp script-generator.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl restart script-generator && sudo systemctl status script-generator --no-pager"
echo.

echo ======================================
echo 배포 완료!
echo ======================================
echo.
echo 접속 URL: http://%SERVER_HOST%:8003
echo 서비스 상태: plink %SERVER_USER%@%SERVER_HOST% "systemctl status script-generator"
echo 로그 확인: plink %SERVER_USER%@%SERVER_HOST% "journalctl -u script-generator -f"
echo.
pause
