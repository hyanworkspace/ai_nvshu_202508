#!/usr/bin/env python3
"""
GitHub Webhook 接收器
用于接收 GitHub 的 push 事件并触发自动部署
"""

import os
import sys
import json
import hmac
import hashlib
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# 配置
WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET', 'your-webhook-secret-here')
DEPLOY_SCRIPT = '/ai_nvshu/webhook-deploy.sh'
PORT = 9000

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        """处理 POST 请求"""
        try:
            # 获取请求头
            content_length = int(self.headers.get('Content-Length', 0))
            content_type = self.headers.get('Content-Type', '')
            signature = self.headers.get('X-Hub-Signature-256', '')
            
            # 读取请求体
            post_data = self.rfile.read(content_length)
            
            # 验证签名
            if not self.verify_signature(post_data, signature):
                self.send_response(401)
                self.end_headers()
                self.wfile.write(b'Unauthorized')
                return
            
            # 解析 JSON 数据
            try:
                payload = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'Invalid JSON')
                return
            
            # 检查是否是 push 事件
            if self.headers.get('X-GitHub-Event') == 'push':
                # 检查分支
                ref = payload.get('ref', '')
                if ref == 'refs/heads/main':  # 只处理 main 分支的推送
                    self.log_message("收到 main 分支推送事件，开始部署...")
                    
                    # 执行部署脚本
                    try:
                        result = subprocess.run(
                            ['bash', DEPLOY_SCRIPT],
                            capture_output=True,
                            text=True,
                            timeout=300  # 5分钟超时
                        )
                        
                        if result.returncode == 0:
                            self.send_response(200)
                            self.end_headers()
                            self.wfile.write(b'Deployment successful')
                            self.log_message("部署成功")
                        else:
                            self.send_response(500)
                            self.end_headers()
                            self.wfile.write(b'Deployment failed')
                            self.log_message(f"部署失败: {result.stderr}")
                            
                    except subprocess.TimeoutExpired:
                        self.send_response(500)
                        self.end_headers()
                        self.wfile.write(b'Deployment timeout')
                        self.log_message("部署超时")
                        
                else:
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(b'Ignored: not main branch')
                    self.log_message(f"忽略非 main 分支推送: {ref}")
            else:
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'Ignored: not push event')
                
        except Exception as e:
            self.log_error(f"处理请求时出错: {str(e)}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(b'Internal server error')
    
    def verify_signature(self, payload, signature):
        """验证 GitHub Webhook 签名"""
        if not signature:
            return False
        
        # 计算期望的签名
        expected_signature = 'sha256=' + hmac.new(
            WEBHOOK_SECRET.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # 使用 hmac.compare_digest 进行安全比较
        return hmac.compare_digest(signature, expected_signature)
    
    def do_GET(self):
        """处理 GET 请求（健康检查）"""
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'Webhook receiver is running')
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        sys.stderr.write(f"[{self.date_time_string()}] {format % args}\n")

def main():
    """启动 Webhook 接收器"""
    print(f"🚀 启动 GitHub Webhook 接收器...")
    print(f"📡 监听端口: {PORT}")
    print(f"🔐 Webhook 密钥: {'已设置' if WEBHOOK_SECRET != 'your-webhook-secret-here' else '未设置'}")
    print(f"📜 部署脚本: {DEPLOY_SCRIPT}")
    
    # 检查部署脚本是否存在
    if not os.path.exists(DEPLOY_SCRIPT):
        print(f"❌ 部署脚本不存在: {DEPLOY_SCRIPT}")
        sys.exit(1)
    
    # 检查部署脚本是否可执行
    if not os.access(DEPLOY_SCRIPT, os.X_OK):
        print(f"❌ 部署脚本不可执行: {DEPLOY_SCRIPT}")
        sys.exit(1)
    
    # 启动服务器
    server = HTTPServer(('0.0.0.0', PORT), WebhookHandler)
    print(f"✅ Webhook 接收器已启动，等待 GitHub 推送...")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 停止 Webhook 接收器...")
        server.shutdown()

if __name__ == '__main__':
    main()

