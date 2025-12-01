from typing import List, Optional, Dict
from pydantic import BaseModel

class Element(BaseModel):
    type: str
    props: Optional[Dict] = None
    children: Optional[List['Element']] = None

Element.update_forward_refs()

class Layout(BaseModel):
    type: str = "Page"
    layout: str  # "vertical" or "horizontal"
    children: List[Element]
