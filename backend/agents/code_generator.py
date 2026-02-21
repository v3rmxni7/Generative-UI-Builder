"""
Agent 4: Code Generator
Converts validated DSL into a React/Tailwind component.
Streams TSX tokens for real-time display.
"""
from __future__ import annotations

import json
from typing import AsyncIterator

from utils.gemini_client import stream_gemini
from utils.logger import log_agent

PROMPT_TEMPLATE = """You are an expert React and Tailwind CSS developer.
Convert the following UI DSL JSON into a single, complete, production-ready React component.

Planner context:
- Layout strategy: {layout_strategy}
- Complexity: {complexity}

STRICT RULES:
- Output ONLY valid TSX code — no markdown, no triple backticks, no explanation
- Start with: import React from 'react';
- Component name MUST be: GeneratedPage
- Use Tailwind CSS utility classes exclusively
- Use semantic HTML (nav, header, main, section, footer, article)
- Make it visually polished: proper spacing, rounded corners, hover states, shadows
- End with: export default GeneratedPage;
- Do NOT add features not present in the DSL
{critique_section}
DSL JSON:
{dsl_json}

Begin the TSX code:"""


async def run_code_generator(
    dsl: dict,
    plan: dict,
    critique: str | None = None,
) -> AsyncIterator[str]:
    """Yields TSX code tokens as they stream from Gemini."""
    critique_section = ""
    if critique:
        critique_section = f"""
IMPORTANT — Previous attempt was rejected. Fix these issues:
{critique}
"""

    prompt = PROMPT_TEMPLATE.format(
        layout_strategy=plan.get("layout_strategy", "single_column"),
        complexity=plan.get("complexity", "medium"),
        critique_section=critique_section,
        dsl_json=json.dumps(dsl, indent=2),
    )

    log_agent("CodeGenerator", status="running")

    async for chunk in stream_gemini(prompt, temperature=0.3):
        yield chunk

    log_agent("CodeGenerator", status="done")
