"""
Gemini 2.0 Flash API client.
Single model handles all agents — vision, planning, code generation, reflection.
"""
from __future__ import annotations

import json
import os
import time
from typing import AsyncIterator

import httpx

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"


def _url(stream: bool = False) -> str:
    action = "streamGenerateContent" if stream else "generateContent"
    return f"{GEMINI_BASE}/models/{GEMINI_MODEL}:{action}?key={GEMINI_API_KEY}"


def _build_contents(
    prompt: str,
    image_b64: str | None = None,
    image_mime: str = "image/png",
) -> list[dict]:
    parts: list[dict] = []
    if image_b64:
        parts.append({
            "inline_data": {"mime_type": image_mime, "data": image_b64}
        })
    parts.append({"text": prompt})
    return [{"role": "user", "parts": parts}]


async def run_gemini(
    prompt: str,
    *,
    image_b64: str | None = None,
    temperature: float = 0.3,
) -> tuple[str, int]:
    """
    Single-shot Gemini call.
    Returns (response_text, total_tokens).
    """
    payload = {
        "contents": _build_contents(prompt, image_b64),
        "generationConfig": {"temperature": temperature},
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(_url(stream=False), json=payload)
        res.raise_for_status()
        data = res.json()

    text = data["candidates"][0]["content"]["parts"][0]["text"]
    tokens = data.get("usageMetadata", {}).get("totalTokenCount", 0)
    return text, tokens


async def stream_gemini(
    prompt: str,
    *,
    image_b64: str | None = None,
    temperature: float = 0.4,
) -> AsyncIterator[str]:
    """
    Streaming Gemini call. Yields text chunks as they arrive.
    """
    payload = {
        "contents": _build_contents(prompt, image_b64),
        "generationConfig": {"temperature": temperature},
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST", _url(stream=True) + "&alt=sse", json=payload
        ) as res:
            res.raise_for_status()
            async for line in res.aiter_lines():
                if not line.startswith("data: "):
                    continue
                raw = line[6:]
                if raw.strip() == "[DONE]":
                    break
                try:
                    chunk = json.loads(raw)
                    parts = (
                        chunk.get("candidates", [{}])[0]
                        .get("content", {})
                        .get("parts", [])
                    )
                    for part in parts:
                        text = part.get("text", "")
                        if text:
                            yield text
                except (json.JSONDecodeError, IndexError, KeyError):
                    continue
