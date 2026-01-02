# Script Generator - PowerShell 배포 스크립트
# Windows PowerShell용

$SERVER_USER = "root"
$SERVER_HOST = "152.42.210.15"
$SERVER_DIR = "/root/script-generator"
$SERVICE_NAME = "script-generator"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Script Generator 배포 시작" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. GitHub 최신 코드 가져오기
Write-Host "[1/5] GitHub에서 최신 코드 가져오기..." -ForegroundColor Yellow
try {
    git pull origin main
    Write-Host "✓ Git pull 완료" -ForegroundColor Green
} catch {
    Write-Host "✗ Git pull 실패: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. 서버 디렉토리 생성
Write-Host "[2/5] 서버 디렉토리 준비..." -ForegroundColor Yellow
$sshCmd = "ssh ${SERVER_USER}@${SERVER_HOST} 'mkdir -p ${SERVER_DIR}'"
try {
    Invoke-Expression $sshCmd
    Write-Host "✓ 디렉토리 생성 완료" -ForegroundColor Green
} catch {
    Write-Host "✗ 서버 연결 실패: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 3. 파일 전송 (scp 또는 WinSCP)
Write-Host "[3/5] 파일 전송 중..." -ForegroundColor Yellow

$filesToCopy = @(
    "main.py",
    "__init__.py",
    "requirements.txt",
    "script-generator.service",
    "nginx-script-generator.conf",
    ".env.example",
    "README.md"
)

foreach ($file in $filesToCopy) {
    if (Test-Path $file) {
        $scpCmd = "scp $file ${SERVER_USER}@${SERVER_HOST}:${SERVER_DIR}/"
        Write-Host "  전송: $file" -ForegroundColor Gray
        Invoke-Expression $scpCmd
    }
}

# templates 폴더 전송
if (Test-Path "templates") {
    $scpCmd = "scp -r templates ${SERVER_USER}@${SERVER_HOST}:${SERVER_DIR}/"
    Write-Host "  전송: templates/" -ForegroundColor Gray
    Invoke-Expression $scpCmd
}

Write-Host "✓ 파일 전송 완료" -ForegroundColor Green
Write-Host ""

# 4. 의존성 설치 및 서비스 설정
Write-Host "[4/5] 서버 설정 중..." -ForegroundColor Yellow
$deployScript = @"
cd ${SERVER_DIR}

# Python 패키지 설치
echo '의존성 설치 중...'
pip3 install -r requirements.txt

# Systemd 서비스 설정
echo '서비스 설정 중...'
sudo cp script-generator.service /etc/systemd/system/
sudo systemctl daemon-reload

# 서비스 재시작
if systemctl is-active --quiet ${SERVICE_NAME}; then
    echo '서비스 재시작 중...'
    sudo systemctl restart ${SERVICE_NAME}
else
    echo '서비스 시작 중...'
    sudo systemctl enable ${SERVICE_NAME}
    sudo systemctl start ${SERVICE_NAME}
fi

# 상태 확인
sleep 2
sudo systemctl status ${SERVICE_NAME} --no-pager
"@

$sshCmd = "ssh ${SERVER_USER}@${SERVER_HOST} `"${deployScript}`""
Invoke-Expression $sshCmd
Write-Host "✓ 서버 설정 완료" -ForegroundColor Green
Write-Host ""

# 5. Nginx 설정 (선택사항)
Write-Host "[5/5] Nginx 설정 (선택사항)" -ForegroundColor Yellow
$response = Read-Host "Nginx 설정을 업데이트하시겠습니까? (Y/N)"

if ($response -eq 'Y' -or $response -eq 'y') {
    $nginxScript = @"
cd ${SERVER_DIR}
sudo cp nginx-script-generator.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/nginx-script-generator.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
echo 'Nginx 설정 완료'
"@
    
    $sshCmd = "ssh ${SERVER_USER}@${SERVER_HOST} `"${nginxScript}`""
    Invoke-Expression $sshCmd
    Write-Host "✓ Nginx 설정 업데이트 완료" -ForegroundColor Green
} else {
    Write-Host "Nginx 설정 건너뛰기" -ForegroundColor Gray
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "배포 완료!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 서비스 상태 확인:" -ForegroundColor White
Write-Host "   ssh ${SERVER_USER}@${SERVER_HOST} 'systemctl status ${SERVICE_NAME}'" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 로그 확인:" -ForegroundColor White
Write-Host "   ssh ${SERVER_USER}@${SERVER_HOST} 'journalctl -u ${SERVICE_NAME} -f'" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 접속 URL:" -ForegroundColor White
Write-Host "   http://${SERVER_HOST}:8003" -ForegroundColor Cyan
Write-Host "   https://script.hyehwa72.org (Nginx 설정 시)" -ForegroundColor Cyan
Write-Host ""
