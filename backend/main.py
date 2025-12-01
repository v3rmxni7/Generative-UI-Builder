from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import json

from schemas.layout_schema import Layout
from utils.image_loader import load_image_base64
from models.vision_to_dsl import image_to_dsl
from models.dsl_to_code import generate_react_code_from_dsl

app = FastAPI()

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # can restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {"message": "Generative UI Builder Backend Alive"}


@app.post("/generate")
async def generate_ui(
    file: UploadFile = File(...),
    instructions: str = Form("")
):
    # 1. image → base64 (async)
    img_b64 = await load_image_base64(file)

    # 2. vision model → DSL dict
    layout_dict = image_to_dsl(img_b64, instructions)

    # 3. Validate against Pydantic schema
    layout = Layout(**layout_dict)

    # 4. DSL JSON → React code
    layout_json_str = json.dumps(layout_dict, indent=2)
    code = generate_react_code_from_dsl(layout_json_str)

    return {
        "layout": layout_dict,
        "code": code
    }
