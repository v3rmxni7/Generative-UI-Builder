"""
Agent 2: Vision
Extracts structured DSL JSON from UI screenshot using planner context.
"""
from __future__ import annotations

import json
from typing import Any

from utils.gemini_client import run_gemini
from utils.logger import log_agent, timed

DSL_SCHEMA = """{
  "type": "Page",
  "layout": "vertical" | "horizontal",
  "children": [
    {
      "type": "Navbar | Header | Hero | Sidebar | Card | Button | Input | Text | Image | Form | Footer | Table | List | Modal | Badge | Avatar | Divider",
      "props": { "text": "...", "placeholder": "...", "href": "...", "variant": "...", "src": "..." },
      "children": []
    }
  ]
}"""


def _build_prompt(plan: dict, instructions: str) -> str:
    plan_context = f"""
Planner analysis:
- Complexity: {plan.get('complexity', 'medium')}
- Layout: {plan.get('layout_strategy', 'single_column')}
- Components detected: {', '.join(plan.get('detected_components', []))}
- Notes: {plan.get('notes', '')}"""

    user_line = f"\nUser instructions: {instructions}" if instructions else ""

    return f"""You are a precise UI layout parser. Using the planner's analysis and the provided image, extract the complete UI structure as a JSON DSL.
{plan_context}{user_line}

Output ONLY a valid JSON object matching this schema:
{DSL_SCHEMA}

Rules:
- Map EVERY visible element to the closest type
- Preserve visual hierarchy with nested children
- Include visible text in props.text
- Use "vertical" for top-to-bottom layouts, "horizontal" for side-by-side
- No markdown, no backticks, no explanation — raw JSON only

Output the JSON:"""


async def run_vision(
    image_b64: str, plan: dict, instructions: str = ""
) -> dict[str, Any]:
    prompt = _build_prompt(plan, instructions)

    with timed("Vision") as ctx:
        raw, tokens = await run_gemini(
            prompt, image_b64=image_b64, temperature=0.2
        )
        ctx["tokens"] = tokens

    parsed = _try_parse(raw)

    log_agent(
        "Vision",
        status="done",
        duration_ms=ctx.get("duration_ms"),
        tokens=ctx.get("tokens"),
        extra={"children_count": len(parsed.get("children", []))},
    )
    return parsed


def _try_parse(text: str) -> dict[str, Any]:
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        return json.loads(text[start:end])
    except (ValueError, json.JSONDecodeError):
        return {"type": "Page", "layout": "vertical", "children": []}
