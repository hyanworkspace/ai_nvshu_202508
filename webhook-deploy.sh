#!/bin/bash

# GitHub Webhook 自动部署脚本
# 使用方法: 将此脚本放在服务器上，通过 GitHub Webhook 调用

set -e

# 配置变量
APP_DIR="/ai_nvshu"
REPO_URL="https://github.com/your-username/ai_nvshu.git"  # 替换为你的仓库地址
BRANCH="main"
SERVICE_NAME="ai-nvshu"
LOG_FILE="/var/log/webhook-deploy.log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

log "🚀 开始自动部署..."

# 1. 进入应用目录
cd $APP_DIR

# 2. 备份当前版本
log "📦 备份当前版本..."
BACKUP_DIR="/backup/ai-nvshu-$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r $APP_DIR/* $BACKUP_DIR/ 2>/dev/null || true

# 3. 拉取最新代码
log "📥 拉取最新代码..."
git fetch origin
git reset --hard origin/$BRANCH
git clean -fd

# 4. 激活虚拟环境
log "🐍 激活虚拟环境..."
source venv/bin/activate

# 5. 更新依赖
log "📚 更新依赖..."
pip install --upgrade pip
pip install -r requirements.txt

# 6. 运行数据库迁移（如果有）
log "🗄️ 运行数据库迁移..."
# python manage.py migrate  # 如果有数据库迁移

# 7. 收集静态文件（如果有）
log "📁 收集静态文件..."
# python manage.py collectstatic --noinput  # 如果有静态文件收集

# 8. 重启服务
log "🔄 重启服务..."
sudo systemctl restart $SERVICE_NAME

# 9. 等待服务启动
log "⏳ 等待服务启动..."
sleep 5

# 10. 检查服务状态
log "✅ 检查服务状态..."
if sudo systemctl is-active --quiet $SERVICE_NAME; then
    log "✅ 服务启动成功！"
    
    # 健康检查
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        log "✅ 健康检查通过！"
    else
        log "⚠️ 健康检查失败，但服务已启动"
    fi
else
    log "❌ 服务启动失败！"
    log "📋 回滚到备份版本..."
    
    # 回滚
    rm -rf $APP_DIR/*
    cp -r $BACKUP_DIR/* $APP_DIR/
    sudo systemctl restart $SERVICE_NAME
    
    log "🔄 已回滚到备份版本"
    exit 1
fi

# 11. 清理旧备份（保留最近5个）
log "🧹 清理旧备份..."
cd /backup
ls -t | tail -n +6 | xargs -r rm -rf

log "🎉 自动部署完成！"

