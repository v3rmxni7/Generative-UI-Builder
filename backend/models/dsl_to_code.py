import subprocess


def run_ollama(model: str, prompt: str) -> str:
    """
    Runs Ollama model locally using subprocess.
    """
    process = subprocess.Popen(
        ["ollama", "run", model],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    out, _ = process.communicate(prompt)
    return out


def generate_react_code_from_dsl(dsl_json_str: str) -> str:
    """
    Takes DSL JSON string and generates production-ready React component.
    """

    prompt = f"""
You are a senior React + Tailwind UI engineer.
Convert the UI DSL JSON into a single production-ready React component.

Rules:
- Output ONLY React/TSX code (no markdown, no triple-backticks, no commentary)
- Name component: GeneratedPage
- Use Tailwind utility classes
- Use semantic HTML
- Keep layout clean and readable
- Do not invent UI that isn't present in DSL

Here is the DSL JSON:

{dsl_json_str}

Return the component code now.
"""

    return run_ollama("codellama:7b-instruct", prompt)
