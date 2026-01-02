#!/bin/bash

# Script Generator SSL 자동 설정 스크립트
# DNS가 설정된 후에 실행하세요

DOMAIN="script.hyehwa72.org"
EMAIL="admin@hyehwa72.org"  # Let's Encrypt 알림용 이메일

echo "======================================"
echo "Script Generator SSL 설정"
echo "======================================"
echo ""
echo "도메인: $DOMAIN"
echo "이메일: $EMAIL"
echo ""

# DNS 확인
echo "[1/5] DNS 확인 중..."
if host $DOMAIN > /dev/null 2>&1; then
    IP=$(host $DOMAIN | grep "has address" | awk '{print $4}' | head -1)
    echo "✓ DNS 설정 확인됨: $DOMAIN → $IP"
else
    echo "✗ DNS가 아직 설정되지 않았습니다!"
    echo "  먼저 DNS A 레코드를 추가하세요:"
    echo "  $DOMAIN → 152.42.210.15"
    exit 1
fi

# Certbot 설치 확인
echo ""
echo "[2/5] Certbot 확인 중..."
if ! command -v certbot &> /dev/null; then
    echo "Certbot 설치 중..."
    sudo apt update
    sudo apt install certbot python3-certbot-nginx -y
fi
echo "✓ Certbot 준비 완료"

# SSL 인증서 발급
echo ""
echo "[3/5] SSL 인증서 발급 중..."
sudo certbot certonly --webroot \
    -w /var/www/html \
    -d $DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive \
    --verbose

if [ $? -eq 0 ]; then
    echo "✓ SSL 인증서 발급 완료"
else
    echo "✗ SSL 인증서 발급 실패"
    echo "  로그를 확인하세요: sudo tail /var/log/letsencrypt/letsencrypt.log"
    exit 1
fi

# HTTPS 설정 적용
echo ""
echo "[4/5] HTTPS 설정 적용 중..."
cd /root/script-generator

# HTTPS 설정으로 교체
sudo cp nginx-script-generator.conf /etc/nginx/sites-available/script-generator

# Nginx 설정 테스트
if sudo nginx -t; then
    echo "✓ Nginx 설정 검증 완료"
else
    echo "✗ Nginx 설정 에러"
    exit 1
fi

# Nginx 리로드
sudo systemctl reload nginx
echo "✓ Nginx 리로드 완료"

# 자동 갱신 설정
echo ""
echo "[5/5] SSL 자동 갱신 설정 확인 중..."
if sudo certbot renew --dry-run > /dev/null 2>&1; then
    echo "✓ SSL 자동 갱신 설정 완료"
else
    echo "⚠ SSL 자동 갱신 테스트 실패 (나중에 확인하세요)"
fi

# 완료
echo ""
echo "======================================"
echo "SSL 설정 완료!"
echo "======================================"
echo ""
echo "✅ HTTPS 접속 가능: https://$DOMAIN"
echo "✅ API 문서: https://$DOMAIN/docs"
echo "✅ Health Check: https://$DOMAIN/health"
echo "✅ n8n 웹훅: https://$DOMAIN/webhook/script"
echo ""
echo "인증서 위치:"
echo "  - Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "  - Private Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo ""
echo "자동 갱신: Certbot이 90일마다 자동으로 갱신합니다"
echo ""
