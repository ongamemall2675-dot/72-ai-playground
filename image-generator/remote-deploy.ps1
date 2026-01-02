# PowerShell 배포 스크립트 - 서버에 SSH로 배포 명령 전송
# 이 스크립트를 실행하여 자동 배포

$SERVER = "realhun@realhun-playground"
$DEPLOY_URL = "https://raw.githubusercontent.com/ongamemall2675-dot/72-ai-playground/main/image-generator/one-step-deploy.sh"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 AI 이미지 생성기 - 원격 배포 시작" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "📡 서버 접속 중: $SERVER" -ForegroundColor Yellow
Write-Host ""

# 배포 스크립트 다운로드 및 실행
$deployCommand = @"
curl -sSL $DEPLOY_URL -o /tmp/deploy.sh && \
chmod +x /tmp/deploy.sh && \
bash /tmp/deploy.sh
"@

Write-Host "📥 배포 스크립트 다운로드 및 실행..." -ForegroundColor Yellow
Write-Host ""

# SSH 명령 실행
ssh $SERVER $deployCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "✅ 배포 완료!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 접속 주소: http://서버IP:8004" -ForegroundColor Cyan
    Write-Host "📝 다음 단계: API 키 설정이 필요합니다" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ 배포 중 오류 발생" -ForegroundColor Red
    Write-Host "Exit Code: $LASTEXITCODE" -ForegroundColor Red
}
