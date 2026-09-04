from typing import Optional
from pydantic import BaseModel, Field, model_validator


class ItemCreate(BaseModel):
    name: str = Field(min_length=3, max_length=50)
    wash_price: Optional[int] = None
    iron_price: Optional[int] = None
    starch_price: Optional[int] = None

    @model_validator(mode="after")
    def check_at_least_one_price(self):
        if (
            self.wash_price is None
            and self.iron_price is None
            and self.starch_price is None
        ):
            raise ValueError(
                "At least one price (wash_price, iron_price, or starch_price) must be provided."
            )
        return self

    class Config:
        json_schema_extra = {
            "example": {
                "name": "T-shirt",
                "wash_price": 700,
                "iron_price": 500,
                "starch_price": 500,
            }
        }
