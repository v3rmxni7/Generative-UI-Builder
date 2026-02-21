from __future__ import annotations

import base64
import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from orchestrator import run_pipeline

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
MAX_IMAGE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "10"))

app = FastAPI(title="Generative UI Builder — Agentic API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    has_key = bool(os.getenv("GEMINI_API_KEY"))
    return {"status": "ok", "gemini_configured": has_key}


@app.post("/generate/stream")
async def generate_ui_stream(
    file: UploadFile = File(...),
    instructions: str = Form(""),
):
    """
    5-agent agentic pipeline streamed via SSE:
      Planner → Vision → Validator → CodeGenerator → Reflection
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="File must be an image.")

    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_IMAGE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413, detail=f"Image exceeds {MAX_IMAGE_MB} MB limit."
        )

    img_b64 = base64.b64encode(raw_bytes).decode("utf-8")

    return StreamingResponse(
        run_pipeline(img_b64, instructions),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
