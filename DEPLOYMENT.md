# 女书 AI 应用部署指南

## Flask + conda 部署流程概述

本指南记录如何将女书 AI 应用部署到服务器上的步骤，并使用 Cloudflare 域名进行访问。

- 1. 准备服务器
- 2. 在服务器上部署 Flask
- 3. 域名购买 & 配置 Cloudflare
- 4. 配置 HTTPS (SSL/TLS)

最后可以找到一个步骤总结。

### 1. 准备服务器

首先，需要一台云服务器（VPS / 云主机）.一般来说选择 Linux 系统（Ubuntu）比较方便。目前使用的有一台UCloud日本的 Ubuntu 24.04。
安装 conda，然后上传项目 & 创建环境。


### 2. 在服务器上部署 Flask

当前生产使用 Gunicorn + Nginx 的组合。

1. **SSH 登录服务器**

   ```bash
   ssh user@your_server_ip
   ```

2. **安装依赖**

   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install python3-pip nginx -y
   ```

3. **上传代码到服务器**（可以用 `scp` 或 Git）

   ```bash
   scp -r ./your_flask_project user@your_server_ip:/home/user/
   ```

4. **创建虚拟环境并安装依赖**
   ```bash
   conda create -n nvshuenv python=3.11 -y
   conda activate nvshuenv
   pip install -r requirements.txt
   ```

5. **安装并运行 Gunicorn**

   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 127.0.0.1:8000 app:app
   ```

   > `app:app` 表示 `app.py` 文件里的 `app = Flask(__name__)`。

6. **配置 systemd 服务**（让它后台运行，掉线不退出）
   
   创建 `/etc/systemd/system/flask.service`：

   ```ini
   [Unit]
   Description=Gunicorn instance to serve Flask app (conda)
   After=network.target

   [Service]
   User=user
   Group=user
   WorkingDirectory=/home/user/your_flask_project
   ExecStart=/home/user/miniconda3/envs/flaskenv/bin/gunicorn -w 4 -b 127.0.0.1:8000 app:app
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

   注意几点：

   * `User` / `Group` 要改成你的 Linux 用户（不是 root）。
   * `ExecStart` 路径改成 conda 环境里 `gunicorn` 的绝对路径，可以用：

   ```bash
   which gunicorn
   ```

   来查。

   保存后执行：

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start flaskapp
   sudo systemctl enable flaskapp
   ```

7. **配置 Nginx 反向代理**
   在 `/etc/nginx/sites-available/flaskapp` 写入：

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   然后启用：

   ```bash
   sudo ln -s /etc/nginx/sites-available/flaskapp /etc/nginx/sites-enabled
   sudo nginx -t
   sudo systemctl restart nginx
   ```

此时你访问 **服务器 IP** 就能看到 女书的 Flask 应用了。

---

### 3. 域名购买 & 配置 Cloudflare

1. 在 Cloudflare 上购买域名（或者在其他地方买了，再托管到 Cloudflare）。

2. 在 **Cloudflare DNS 设置**里，添加一条 **A 记录**：

   * 名称：`@`（表示根域名）
   * 值：你的服务器公网 IP
   * 代理状态：开启橙色小云（开启 Cloudflare 代理 & CDN）

3. 等待解析生效（通常几分钟到几小时）。

---

### 4. 配置 HTTPS (SSL/TLS)

Cloudflare 可以自动给你提供 HTTPS，但推荐后端也支持。

* 在 Cloudflare 面板 → SSL/TLS 设置 → 选择 **Full (strict)** 模式。
* 在服务器上用 **Certbot** 申请证书（Let’s Encrypt 免费）：

  ```bash
  sudo apt install certbot python3-certbot-nginx -y
  sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
  ```
* 自动续期：

  ```bash
  sudo systemctl status certbot.timer
  ```

完成后，Flask 应用就能通过 `https://yourdomain.com` 访问 Flask 应用了 🎉。

---

## 步骤总结

* 代码准备好 → 选一台服务器
* Flask 部署 → Gunicorn + Nginx
* Cloudflare 域名 → A 记录指向服务器 IP
* 开启 HTTPS → Certbot + Cloudflare