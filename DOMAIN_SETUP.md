# 域名配置指南

## 🌐 GoDaddy 域名配置

### 1. 登录 GoDaddy 控制面板
- 访问 [GoDaddy 管理页面](https://dcc.godaddy.com/)
- 登录你的账户

### 2. 配置 DNS 记录

#### A 记录
1. 找到你的域名，点击 "DNS"
2. 添加以下记录：

| 类型 | 名称 | 值 | TTL |
|------|------|-----|-----|
| A | @ | 你的服务器IP | 600 |
| A | www | 你的服务器IP | 600 |

### 3. 等待 DNS 传播
- DNS 更改通常需要 5-30 分钟生效
- 可以使用 [DNS Checker](https://dnschecker.org/) 检查传播状态

## 🚀 部署步骤

### 1. 上传代码到服务器
```bash
# 方法一：使用 scp
scp -r ./ai_nvshu user@your-server-ip:/var/www/

# 方法二：使用 git (推荐)
# 在服务器上：
cd /var/www
git clone https://github.com/your-username/ai_nvshu.git
```

### 2. 运行部署脚本
```bash
cd /var/www/ai-nvshu
chmod +x deploy.sh
./deploy.sh
```

### 3. 配置环境变量
```bash
nano .env
# 设置你的 ZHIPU_API_KEY
```

### 4. 配置 Nginx
```bash
# 复制 Nginx 配置
sudo cp nginx.conf /etc/nginx/sites-available/ai-nvshu

# 编辑配置文件，替换域名
sudo nano /etc/nginx/sites-available/ai-nvshu

# 启用站点
sudo ln -s /etc/nginx/sites-available/ai-nvshu /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 5. 配置 SSL 证书
```bash
chmod +x setup-ssl.sh
./setup-ssl.sh your-domain.com
```

## 🔧 常用管理命令

### 查看应用状态
```bash
sudo systemctl status ai-nvshu
```

### 重启应用
```bash
sudo systemctl restart ai-nvshu
```

### 查看日志
```bash
# 应用日志
sudo journalctl -u ai-nvshu -f

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 更新应用
```bash
cd /var/www/ai-nvshu
git pull origin main
sudo systemctl restart ai-nvshu
```

## 🛡️ 安全建议

### 1. 防火墙配置
```bash
# 只允许必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. 定期备份
```bash
# 创建备份脚本
cat > backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
tar -czf /backup/ai-nvshu_\$DATE.tar.gz /var/www/ai-nvshu
find /backup -name "ai-nvshu_*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh
```

### 3. 监控设置
- 设置服务器监控
- 配置日志轮转
- 设置磁盘空间警告

## 🆘 故障排除

### 应用无法启动
```bash
# 检查服务状态
sudo systemctl status ai-nvshu

# 查看详细错误
sudo journalctl -u ai-nvshu -n 50
```

### 域名无法访问
```bash
# 检查 DNS 解析
nslookup your-domain.com

# 检查 Nginx 状态
sudo systemctl status nginx

# 检查端口监听
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### SSL 证书问题
```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew
```
