from typing import Generic, TypeVar, Any
from pydantic import BaseModel, ConfigDict, Field

# 1. Define the Generic Base Response
T = TypeVar("T")


class BaseResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)

    success: bool = Field(default=True, description="Requst status")
    message: str = Field(default="Request processed successfully")
    data: T | None = Field(default=None, description="The payload of the response")


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool


class PaginatedData(BaseModel, Generic[T]):
    items: list[T]
    meta: PaginationMeta
