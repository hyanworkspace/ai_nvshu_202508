#!/bin/bash

echo "🌐 服务器IP地址信息"
echo "===================="

echo "📡 内网IP地址："
ip addr show | grep -E "inet [0-9]" | grep -v "127.0.0.1" | awk '{print $2}' | cut -d'/' -f1

echo ""
echo "🌍 公网IP地址："
curl -s ifconfig.me
echo ""

echo "🏠 主机名："
hostname

echo ""
echo "🔗 网络接口详情："
ip addr show | grep -A 2 -E "inet [0-9]"

echo ""
echo "📊 路由信息："
ip route show default

