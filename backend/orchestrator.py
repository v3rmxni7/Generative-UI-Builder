"""
Orchestrator: wires the 5-agent pipeline and yields SSE events.

Flow:
  Planner → Vision → Validator (repair loop) → CodeGenerator (streaming) → Reflection
  If Reflection rejects (score < 7) → retry CodeGenerator once with critique.
"""
from __future__ import annotations

import json
from typing import Any, AsyncIterator

from agents.planner import run_planner
from agents.vision import run_vision
from agents.validator import run_validator
from agents.code_generator import run_code_generator
from agents.reflection import run_reflection

MAX_CODE_RETRIES = 1


def _sse(data: dict[str, Any]) -> str:
    return f"data: {json.dumps(data)}\n\n"


async def run_pipeline(
    image_b64: str,
    instructions: str = "",
) -> AsyncIterator[str]:
    """
    Runs the full agentic pipeline, yielding SSE events at each step.
    Event types: agent, plan, dsl, code_chunk, reflection, done, error
    """
    try:
        # ── Agent 1: Planner ──────────────────────────────────
        yield _sse({"type": "agent", "name": "Planner", "status": "running"})
        plan = await run_planner(image_b64, instructions)
        yield _sse({"type": "agent", "name": "Planner", "status": "done"})
        yield _sse({"type": "plan", "payload": plan})

        # ── Agent 2: Vision ───────────────────────────────────
        yield _sse({"type": "agent", "name": "Vision", "status": "running"})
        dsl = await run_vision(image_b64, plan, instructions)
        yield _sse({"type": "agent", "name": "Vision", "status": "done"})
        yield _sse({"type": "dsl", "payload": dsl})

        # ── Agent 3: Validator ────────────────────────────────
        yield _sse({"type": "agent", "name": "Validator", "status": "running"})
        validated_dsl, validation_issues = await run_validator(dsl)
        if validation_issues:
            yield _sse({
                "type": "agent",
                "name": "Validator",
                "status": "repaired",
                "issues": validation_issues,
            })
        else:
            yield _sse({"type": "agent", "name": "Validator", "status": "done"})

        # Update DSL if it was repaired
        if validated_dsl != dsl:
            dsl = validated_dsl
            yield _sse({"type": "dsl", "payload": dsl})

        # ── Agent 4 & 5: Code Generation + Reflection loop ───
        critique: str | None = None

        for attempt in range(1 + MAX_CODE_RETRIES):
            # Code Generator (streaming)
            label = "CodeGenerator" if attempt == 0 else f"CodeGenerator (retry {attempt})"
            yield _sse({"type": "agent", "name": label, "status": "running"})

            code_chunks: list[str] = []
            async for token in run_code_generator(dsl, plan, critique):
                code_chunks.append(token)
                yield _sse({"type": "code_chunk", "payload": token})

            full_code = "".join(code_chunks)
            yield _sse({"type": "agent", "name": label, "status": "done"})

            # Reflection
            yield _sse({"type": "agent", "name": "Reflection", "status": "running"})
            reflection = await run_reflection(dsl, full_code)
            yield _sse({
                "type": "reflection",
                "payload": {
                    "score": reflection["score"],
                    "approved": reflection["approved"],
                    "issues": reflection["issues"],
                },
            })
            yield _sse({"type": "agent", "name": "Reflection", "status": "done"})

            if reflection["approved"]:
                break

            # Not approved — retry with critique
            if attempt < MAX_CODE_RETRIES:
                critique = reflection.get("critique", "")
                yield _sse({
                    "type": "agent",
                    "name": "CodeGenerator",
                    "status": "retrying",
                    "reason": critique,
                })
                # Clear previous code so frontend knows a new stream is coming
                yield _sse({"type": "code_reset"})

        yield _sse({"type": "done"})

    except Exception as exc:
        yield _sse({"type": "error", "payload": str(exc)})
