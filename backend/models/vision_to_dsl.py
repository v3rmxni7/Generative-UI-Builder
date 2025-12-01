import json
import subprocess
from typing import Dict


def run_ollama(model: str, prompt: str) -> str:
    """
    Runs an Ollama model locally using subprocess.
    You can replace model name later without changing code.
    """
    process = subprocess.Popen(
        ["ollama", "run", model],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    out, _ = process.communicate(prompt)
    return out


def image_to_dsl(base64_image: str, user_instructions: str = "") -> Dict:
    """
    Convert a UI screenshot (as base64 string) into DSL layout JSON (dict).
    """

    prompt = f"""
You are a strict UI layout parser.
You output ONLY a valid JSON object.

NO explanations.
NO markdown.
NO backticks.
NO extra text.
Only JSON.

Schema:
{{
  "type": "Page",
  "layout": "horizontal | vertical",
  "children": [
    {{
      "type": "Header | Text | Button | Input | Image | Card",
      "props": {{}},
      "children": []
    }}
  ]
}}

Rules:
- If you don't know a value, set empty object: {{}}
- If element has no children, set children: []
- Do NOT invent UI
- Follow schema exactly

Image (base64 encoded):
<image>{base64_image}</image>

User instructions:
{user_instructions}

Return ONLY JSON.
"""

    # --- STEP 1: Primary model call ---
    raw = run_ollama("llava:7b", prompt)

    # --- STEP 2: attempt to parse ---
    try:
        return json.loads(raw)
    except:
        pass

    # --- STEP 3: Repair prompt using the same model ---
    repair_prompt = f"""
Convert the following output into STRICT JSON.
NO markdown. NO text. Only JSON.

Output:
{raw}
"""
    fixed = run_ollama("llava:7b", repair_prompt)

    try:
        return json.loads(fixed)
    except:
        # --- STEP 4: Absolute fallback ---
        return {
            "type": "Page",
            "layout": "vertical",
            "children": []
        }
