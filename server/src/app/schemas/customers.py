from typing import Optional
from pydantic import BaseModel, Field


class CustomerCreate(BaseModel):
    name: str = Field(min_length=3, max_length=50)
    phone_number: str = Field(min_length=10, max_length=14)
    address: str = Field(min_length=5, max_length=200)
    id_in_browser: Optional[int] = None
