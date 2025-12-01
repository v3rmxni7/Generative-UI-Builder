import base64
from fastapi import UploadFile

async def load_image_base64(file: UploadFile):
    content = await file.read()
    return base64.b64encode(content).decode("utf-8")
