#!/usr/bin/env python3
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

print("Starting 3Dlearn local server...")
print("Open http://localhost:8000/app.html")
print("Do not open app.html directly with file://")

try:
    raise SystemExit(subprocess.call(["node", "local-server.mjs"]))
except FileNotFoundError:
    print("Node.js 18+ is required to run local-server.mjs.")
    sys.exit(1)
