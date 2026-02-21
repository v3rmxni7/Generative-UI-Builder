"""
Agent 1: Planner
Analyzes the image and instructions to decide generation strategy.
Outputs a plan dict that guides downstream agents.
"""
from __future__ import annotations

from utils.gemini_client import run_gemini
from utils.logger import log_agent, timed
import json

PROMPT = """You are a UI analysis planner. Analyze the provided UI screenshot and output a JSON plan.

Output ONLY a valid JSON object:
{
  "complexity": "low" | "medium" | "high",
  "component_count": <integer>,
  "detected_components": ["Navbar", "Hero", "Card", ...],
  "layout_strategy": "single_column" | "sidebar" | "grid" | "dashboard",
  "has_navigation": true | false,
  "has_forms": true | false,
  "has_data_display": true | false,
  "notes": "brief description of what you see"
}

No markdown. No backticks. Only JSON."""


async def run_planner(image_b64: str, instructions: str = "") -> dict:
    extra = f"\nUser instructions: {instructions}" if instructions else ""
    prompt = PROMPT + extra

    with timed("Planner") as ctx:
        raw, tokens = await run_gemini(prompt, image_b64=image_b64, temperature=0.2)
        ctx["tokens"] = tokens

    try:
        start = raw.index("{")
        end = raw.rindex("}") + 1
        plan = json.loads(raw[start:end])
    except (ValueError, json.JSONDecodeError):
        plan = {
            "complexity": "medium",
            "component_count": 5,
            "detected_components": [],
            "layout_strategy": "single_column",
            "has_navigation": False,
            "has_forms": False,
            "has_data_display": False,
            "notes": "Could not parse plan, using defaults.",
        }

    log_agent(
        "Planner",
        status="done",
        duration_ms=ctx.get("duration_ms"),
        tokens=ctx.get("tokens"),
        extra={"complexity": plan.get("complexity")},
    )
    return plan
