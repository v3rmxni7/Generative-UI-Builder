"""
Agent 3: Validator
Validates DSL against Pydantic schema.
If invalid → calls Gemini to repair (max 2 attempts).
"""
from __future__ import annotations

import json
from typing import Any

from pydantic import ValidationError

from schemas.layout_schema import Layout
from utils.gemini_client import run_gemini
from utils.logger import log_agent, timed

MAX_REPAIR_ATTEMPTS = 2

REPAIR_PROMPT = """The following JSON DSL has validation errors. Fix them and return ONLY the corrected JSON.

Errors:
{errors}

Original JSON:
{dsl_json}

Rules:
- "layout" must be exactly "vertical" or "horizontal"
- Every child must have "type" as a string
- "props" must be an object of string key-value pairs or null
- "children" must be an array or null
- Output raw JSON only, no markdown, no backticks

Corrected JSON:"""


async def run_validator(dsl: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    """
    Returns (validated_dsl, issues_list).
    issues_list is empty if valid on first try.
    """
    issues: list[str] = []

    # Try direct validation
    try:
        Layout(**dsl)
        log_agent("Validator", status="done", extra={"valid": True, "attempts": 0})
        return dsl, issues
    except ValidationError as e:
        issues.append(f"Initial validation failed: {e.error_count()} errors")
        last_error = e  # capture before Python deletes it at end of except block

    # Repair loop — use the initial validation error to drive the first repair
    current = dsl

    for attempt in range(1, MAX_REPAIR_ATTEMPTS + 1):
        error_summary = "; ".join(
            f"{err['loc']}: {err['msg']}" for err in last_error.errors()[:5]
        )
        issues.append(f"Attempt {attempt}: {error_summary}")

        with timed("Validator") as ctx:
            prompt = REPAIR_PROMPT.format(
                errors=error_summary,
                dsl_json=json.dumps(current, indent=2),
            )
            raw, tokens = await run_gemini(prompt, temperature=0.1)
            ctx["tokens"] = tokens

        log_agent(
            "Validator",
            status="repairing",
            duration_ms=ctx.get("duration_ms"),
            tokens=ctx.get("tokens"),
            extra={"attempt": attempt},
        )

        try:
            start = raw.index("{")
            end = raw.rindex("}") + 1
            current = json.loads(raw[start:end])
        except (ValueError, json.JSONDecodeError):
            issues.append(f"Repair attempt {attempt} produced unparseable output")
            continue

        # Validate the repaired result
        try:
            Layout(**current)
            log_agent(
                "Validator",
                status="done",
                extra={"valid": True, "attempts": attempt},
            )
            return current, issues
        except ValidationError as ve:
            last_error = ve
            continue

    # Final attempt after all repairs
    try:
        Layout(**current)
    except ValidationError:
        issues.append("All repair attempts failed, using best-effort DSL")

    log_agent(
        "Validator",
        status="done",
        extra={"valid": False, "attempts": MAX_REPAIR_ATTEMPTS},
    )
    return current, issues
