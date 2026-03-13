<img width="2816" height="1536" alt="Generative UI Builder" src="https://github.com/user-attachments/assets/3a5e6e06-cfe7-49c5-9684-71d74066e12b" />

# Generative UI Builder

Screenshot-to-code pipeline powered by a 5-agent agentic architecture using Gemini 2.0 Flash. Upload a UI screenshot, get a production-ready React/Tailwind component.

## Architecture

The backend runs a sequential multi-agent pipeline, streamed to the frontend via SSE:

```
Planner → Vision → Validator (self-repair loop) → Code Generator (streaming) → Reflection
```

| Agent | Role |
|---|---|
| **Planner** | Analyzes the screenshot and decides complexity, layout strategy, and component inventory |
| **Vision** | Extracts a structured DSL (JSON) representing every UI element and its hierarchy |
| **Validator** | Validates DSL against a Pydantic schema; auto-repairs with Gemini if invalid (up to 2 attempts) |
| **Code Generator** | Converts validated DSL into a React/Tailwind TSX component, streamed token-by-token |
| **Reflection** | Scores the generated code (1-10) against the DSL; if score < 7, retries code generation with critique |

## Tech Stack

**Backend** — Python, FastAPI, httpx, Pydantic, Gemini 2.0 Flash API

**Frontend** — Next.js 14, React 18, Tailwind CSS, Monaco Editor, Babel (in-browser transpilation)

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A [Gemini API key](https://aistudio.google.com/apikey)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env with your key
echo "GEMINI_API_KEY=your-key-here" > .env

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` and expects the backend at `http://localhost:8000` by default.

To override the backend URL, set `NEXT_PUBLIC_API_URL` in `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
backend/
  main.py                  # FastAPI app, /generate/stream endpoint
  orchestrator.py          # Wires the 5-agent pipeline, yields SSE events
  agents/
    planner.py             # Agent 1: image analysis and planning
    vision.py              # Agent 2: DSL extraction from screenshot
    validator.py           # Agent 3: Pydantic validation + self-repair
    code_generator.py      # Agent 4: DSL → React/Tailwind TSX (streaming)
    reflection.py          # Agent 5: code quality scoring and critique
  schemas/
    layout_schema.py       # Pydantic models for DSL validation
  utils/
    gemini_client.py       # Gemini API client (single-shot + streaming)
    logger.py              # Structured JSON logger for agent observability

frontend/
  app/
    page.tsx               # Main page with resizable panel layout
    layout.tsx             # Root layout with dark theme
    preview/page.tsx       # Standalone preview route
  components/
    ControlPanel.tsx       # Image upload, instructions, generate button
    AgentTimeline.tsx      # Real-time agent status display
    OutputPanel.tsx        # Tabbed output (DSL JSON / React Code / Preview)
    CodeViewer.tsx         # Monaco editor with copy/download
    LivePreview.tsx        # In-browser Babel transpilation + sandboxed iframe
  hooks/
    useGenerationStream.ts # SSE client, state management for the pipeline
  types/
    generation.ts          # TypeScript interfaces for DSL, agents, plan, reflection
```

## License

MIT
