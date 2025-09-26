# GitHub Webhook 自动部署配置指南

## 🔗 配置 GitHub Webhook

### 1. 生成 Webhook 密钥
```bash
# 在服务器上生成一个安全的密钥
openssl rand -hex 32
```

### 2. 配置服务器端密钥
```bash
# 编辑 Webhook 服务配置
sudo nano /etc/systemd/system/webhook.service

# 将 your-webhook-secret-here 替换为生成的密钥
Environment=WEBHOOK_SECRET=your-generated-secret-here

# 重启 Webhook 服务
sudo systemctl restart webhook
```

### 3. 在 GitHub 中设置 Webhook

#### 步骤：
1. 访问你的 GitHub 仓库
2. 点击 **Settings** 标签
3. 在左侧菜单中点击 **Webhooks**
4. 点击 **Add webhook** 按钮

#### 配置参数：
- **Payload URL**: `https://your-domain.com/webhook`
- **Content type**: `application/json`
- **Secret**: 输入你在步骤1中生成的密钥
- **Which events**: 选择 "Just the push event"
- **Active**: 确保勾选

#### 高级设置：
- **SSL verification**: 启用（推荐）
- **Active**: 启用

### 4. 测试 Webhook

#### 方法一：推送测试
```bash
# 在本地做一个小改动并推送
echo "# Test deployment" >> README.md
git add README.md
git commit -m "Test webhook deployment"
git push origin main
```

#### 方法二：手动测试
```bash
# 在服务器上查看 Webhook 日志
sudo journalctl -u webhook -f

# 查看部署日志
tail -f /var/log/webhook-deploy.log
```

## 🔧 管理命令

### 查看 Webhook 服务状态
```bash
sudo systemctl status webhook
```

### 重启 Webhook 服务
```bash
sudo systemctl restart webhook
```

### 查看 Webhook 日志
```bash
sudo journalctl -u webhook -f
```

### 查看部署日志
```bash
tail -f /var/log/webhook-deploy.log
```

### 手动触发部署
```bash
bash /ai_nvshu/webhook-deploy.sh
```

## 🛡️ 安全配置

### 1. 防火墙设置
```bash
# 确保只允许必要的端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 9000   # 禁止直接访问 Webhook 端口
```

### 2. 密钥管理
```bash
# 定期更换 Webhook 密钥
openssl rand -hex 32

# 更新服务配置
sudo nano /etc/systemd/system/webhook.service
sudo systemctl restart webhook

# 在 GitHub 中更新密钥
```

### 3. 访问控制
```bash
# 限制 Webhook 接收器的访问
# 在 Nginx 中添加 IP 白名单（可选）
location /webhook {
    allow 140.82.112.0/20;  # GitHub IP 范围
    allow 192.30.252.0/22;  # GitHub IP 范围
    deny all;
    
    proxy_pass http://127.0.0.1:9000;
    # ... 其他配置
}
```

## 🆘 故障排除

### Webhook 不工作
1. **检查服务状态**:
   ```bash
   sudo systemctl status webhook
   ```

2. **检查端口监听**:
   ```bash
   sudo netstat -tlnp | grep :9000
   ```

3. **检查 Nginx 配置**:
   ```bash
   sudo nginx -t
   ```

4. **查看错误日志**:
   ```bash
   sudo journalctl -u webhook -n 50
   ```

### 部署失败
1. **检查部署脚本权限**:
   ```bash
   ls -la /ai_nvshu/webhook-deploy.sh
   ```

2. **检查 Git 配置**:
   ```bash
   cd /ai_nvshu
   git remote -v
   git status
   ```

3. **检查应用服务**:
   ```bash
   sudo systemctl status ai-nvshu
   ```

### 签名验证失败
1. **检查密钥配置**:
   ```bash
   sudo systemctl show webhook | grep WEBHOOK_SECRET
   ```

2. **重新生成密钥**:
   ```bash
   openssl rand -hex 32
   ```

## 📊 监控和通知

### 设置部署通知
```bash
# 在 webhook-deploy.sh 中添加通知
# 例如发送邮件或 Slack 通知
curl -X POST -H 'Content-type: application/json' \
--data '{"text":"AI Nüshu 应用已成功部署！"}' \
YOUR_SLACK_WEBHOOK_URL
```

### 监控部署状态
```bash
# 创建监控脚本
cat > /ai_nvshu/monitor-deployment.sh << EOF
#!/bin/bash
if ! curl -f http://localhost:8000/health >/dev/null 2>&1; then
    echo "应用健康检查失败，发送告警..."
    # 发送告警通知
fi
EOF

chmod +x /ai_nvshu/monitor-deployment.sh

# 添加到 crontab
echo "*/5 * * * * /ai_nvshu/monitor-deployment.sh" | crontab -
```

## 🎯 最佳实践

1. **分支策略**: 只对 `main` 分支启用自动部署
2. **测试环境**: 为 `develop` 分支设置单独的测试环境
3. **回滚机制**: 部署失败时自动回滚到上一个版本
4. **通知机制**: 部署成功/失败时发送通知
5. **监控告警**: 设置应用健康监控和告警

