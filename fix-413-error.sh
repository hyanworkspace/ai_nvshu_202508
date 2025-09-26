#!/bin/bash

# 修复 413 错误的完整脚本
# 使用方法: ./fix-413-error.sh

set -e

echo "🔧 修复 413 错误 - 文件上传大小限制问题"

# 1. 检查当前配置
echo "📋 检查当前配置..."

echo "Flask MAX_CONTENT_LENGTH:"
grep "MAX_CONTENT_LENGTH" /ai_nvshu/app.py

echo "Nginx client_max_body_size:"
grep "client_max_body_size" /ai_nvshu/nginx.conf

# 2. 更新 Flask 配置
echo "🐍 更新 Flask 配置..."
sed -i 's/MAX_CONTENT_LENGTH.*=.*[0-9]* \* 1024 \* 1024/MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB/' /ai_nvshu/app.py

# 3. 更新 Nginx 配置
echo "🌐 更新 Nginx 配置..."
sed -i 's/client_max_body_size [0-9]*M/client_max_body_size 100M/' /ai_nvshu/nginx.conf

# 4. 更新 Gunicorn 配置
echo "🔄 更新 Gunicorn 配置..."
cat > /ai_nvshu/gunicorn.conf.py << EOF
bind = "127.0.0.1:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 60
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
user = "$USER"
group = "$USER"
tmp_upload_dir = None
# 增加请求体大小限制
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8192
EOF

# 5. 检查系统限制
echo "🖥️ 检查系统限制..."
echo "ulimit -f: $(ulimit -f)"
echo "ulimit -d: $(ulimit -d)"

# 6. 更新系统限制
echo "⚙️ 更新系统限制..."
echo "* soft fsize unlimited" | sudo tee -a /etc/security/limits.conf
echo "* hard fsize unlimited" | sudo tee -a /etc/security/limits.conf
echo "* soft data unlimited" | sudo tee -a /etc/security/limits.conf
echo "* hard data unlimited" | sudo tee -a /etc/security/limits.conf

# 7. 重启服务
echo "🔄 重启服务..."

# 重启 Nginx
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "✅ Nginx 配置已重新加载"
else
    echo "❌ Nginx 配置有误"
    exit 1
fi

# 重启应用服务
sudo systemctl restart ai-nvshu
echo "✅ 应用服务已重启"

# 8. 验证配置
echo "✅ 验证配置..."

echo "新的 Flask 配置:"
grep "MAX_CONTENT_LENGTH" /ai_nvshu/app.py

echo "新的 Nginx 配置:"
grep "client_max_body_size" /ai_nvshu/nginx.conf

echo "服务状态:"
sudo systemctl status ai-nvshu --no-pager -l
sudo systemctl status nginx --no-pager -l

# 9. 测试配置
echo "🧪 测试配置..."
sleep 5

if curl -f http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ 应用健康检查通过"
else
    echo "⚠️ 应用健康检查失败"
fi

if curl -f http://localhost/health >/dev/null 2>&1; then
    echo "✅ Nginx 代理健康检查通过"
else
    echo "⚠️ Nginx 代理健康检查失败"
fi

echo "🎉 413 错误修复完成！"
echo "📋 配置摘要:"
echo "- Flask 文件大小限制: 100MB"
echo "- Nginx 文件大小限制: 100MB"
echo "- Gunicorn 超时时间: 60秒"
echo "- 系统文件大小限制: 无限制"

echo ""
echo "🔍 如果问题仍然存在，请检查:"
echo "1. 浏览器缓存 - 清除缓存后重试"
echo "2. 文件实际大小 - 确保不超过 100MB"
echo "3. 网络连接 - 检查网络稳定性"
echo "4. 服务器日志 - 查看详细错误信息"

