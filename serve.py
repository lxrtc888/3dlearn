#!/usr/bin/env python3
import http.server
import socketserver
import os

# 切换到脚本所在目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"服务器已启动: http://localhost:{PORT}")
    print(f"当前目录: {os.getcwd()}")
    httpd.serve_forever()
