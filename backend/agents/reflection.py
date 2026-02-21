"""
Agent 5: Reflection
Reviews generated code against the DSL.
Outputs a quality score and critique.
If score < 7 → orchestrator retries code generation with the critique.
"""
from __future__ import annotations

import json
from typing import Any

from utils.gemini_client import run_gemini
from utils.logger import log_agent, timed

THRESHOLD = 7

PROMPT = """You are a senior code reviewer evaluating a React component against its source DSL specification.

DSL (source of truth):
{dsl_json}

Generated React Code:
{code}

Evaluate and output ONLY a JSON object:
{{
  "score": <1-10>,
  "approved": true | false,
  "issues": ["issue 1", "issue 2"],
  "critique": "single paragraph summary of what to fix (empty if approved)"
}}

Scoring guide:
- 10: Perfect match, production-ready
- 7-9: Minor issues, acceptable
- 4-6: Missing components or wrong layout
- 1-3: Major structural problems

Set approved=true if score >= 7.
No markdown, no backticks — raw JSON only."""


async def run_reflection(
    dsl: dict, code: str
) -> dict[str, Any]:
    prompt = PROMPT.format(
        dsl_json=json.dumps(dsl, indent=2),
        code=code,
    )

    with timed("Reflection") as ctx:
        raw, tokens = await run_gemini(prompt, temperature=0.2)
        ctx["tokens"] = tokens

    try:
        start = raw.index("{")
        end = raw.rindex("}") + 1
        result = json.loads(raw[start:end])
    except (ValueError, json.JSONDecodeError):
        result = {"score": 5, "approved": False, "issues": ["Failed to parse reflection"], "critique": ""}

    # Ensure required fields
    result.setdefault("score", 5)
    result.setdefault("approved", result["score"] >= THRESHOLD)
    result.setdefault("issues", [])
    result.setdefault("critique", "")

    log_agent(
        "Reflection",
        status="done",
        duration_ms=ctx.get("duration_ms"),
        tokens=ctx.get("tokens"),
        extra={"score": result["score"], "approved": result["approved"]},
    )
    return result
