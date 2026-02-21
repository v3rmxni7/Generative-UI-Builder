from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel


class Element(BaseModel):
    type: str
    props: Optional[Dict[str, str]] = None
    children: Optional[List[Element]] = None


Element.model_rebuild()


class Layout(BaseModel):
    type: str = "Page"
    layout: Literal["vertical", "horizontal"]
    children: List[Element]
