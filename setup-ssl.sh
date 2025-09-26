#!/bin/bash

# SSL 证书配置脚本
# 使用方法: ./setup-ssl.sh your-domain.com

set -e

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "❌ 请提供域名"
    echo "使用方法: ./setup-ssl.sh your-domain.com"
    exit 1
fi

echo "🔐 为域名 $DOMAIN 配置 SSL 证书..."

# 1. 安装 Certbot
echo "📦 安装 Certbot..."
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 2. 获取 SSL 证书
echo "🔑 获取 SSL 证书..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# 3. 测试自动续期
echo "🔄 测试证书续期..."
sudo certbot renew --dry-run

# 4. 设置自动续期
echo "⏰ 设置自动续期..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo "✅ SSL 证书配置完成！"
echo "📋 证书信息："
sudo certbot certificates

echo "🌐 现在可以通过 https://$DOMAIN 访问你的应用了！"
