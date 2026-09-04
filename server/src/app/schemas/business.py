from typing import Optional
from pydantic import BaseModel, Field, model_validator


class BusinessSchema(BaseModel):
    name: str = Field(min_length=3, max_length=30)
    phone_number: str = Field(min_length=11, max_length=15)
    address: str = Field(min_length=5, max_length=100)
    bank_name: str = Field(min_length=3, max_length=50)
    account_number: str = Field(min_length=10, max_length=10)
    account_name: str = Field(min_length=5, max_length=100)
    default_delivery_price: int

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Cleansheet Laundry",
                "phone_number": "2348012345678",
                "address": "23 The Best Estate, Ikeja, Lagos",
                "bank_name": "First Bank",
                "account_number": "0123456789",
                "account_name": "Cleansheet Laundry Services",
                "default_delivery_price": 1500,
            }
        }
