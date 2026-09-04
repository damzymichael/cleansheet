from fastapi import APIRouter, Request, status, Depends, HTTPException
from app.schemas.items import ItemCreate
from sqlalchemy import func, select
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.base import BaseResponse
from app import models
from app.core.auth import hash_password, CurrentUser, get_current_user

router = APIRouter(prefix="/item", tags=["Items"])

# TODO
@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse,
    description="Add new item and prices",
)
async def add_item(
    item: ItemCreate,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(models.User).where(models.User.id == current_user.user_id)
    )
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    print(user.business_id)
    return {"message": "Item created successfully"}
