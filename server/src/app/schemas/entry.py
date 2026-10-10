from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models import Collection_Mode


class EntryItemCreate(BaseModel):
    cloth_id: Optional[str] = None
    cloth_name: str
    quantity: int = Field(default=1, ge=1)
    wash: bool = True
    iron: bool = False
    starch: bool = False
    price: Optional[int] = 0


class EntryCreate(BaseModel):
    customer_name: str
    items: List[EntryItemCreate]
    due_date: Optional[datetime] = None
    collection_mode: Collection_Mode = Collection_Mode.PICKUP
    delivery_fee: int = 0
    discount_price: int = 0
    paid: bool = False
    id_in_browser: Optional[int] = None
    created_at: Optional[datetime] = None


class EntryItemResponse(BaseModel):
    id: str
    item_id: str
    cloth_name: str
    quantity: int
    wash: bool
    iron: bool
    starch: bool
    price: int


class EntryResponse(BaseModel):
    id: str
    customer_name: str
    customer_id: str
    items: List[EntryItemResponse]
    due_date: Optional[datetime] = None
    collection_mode: str
    delivery_fee: int
    discount_price: int
    paid: bool
    price: int
    id_in_browser: Optional[int] = None
    created_at: datetime
