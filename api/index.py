"""
Veyra - Serverless API Entry Point for Vercel

Exposes the FastAPI application as an ASGI handler for Vercel's Python runtime.
Mounts both /api/* and root routes for seamless Vercel serverless routing.
"""

import os
import sys
from pathlib import Path

# Add project root to sys.path so backend modules can be imported
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Import the configured FastAPI application
from backend.main import app

# Vercel Serverless automatically detects the ASGI 'app' object
