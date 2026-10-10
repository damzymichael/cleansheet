import math
from fastapi import APIRouter, status, Depends, HTTPException, Query
from typing import Annotated, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.schemas.base import BaseResponse
from app.schemas.items import ItemCreate
from app import models
from app.core.auth import CurrentUser, get_current_user

router = APIRouter(prefix="/items", tags=["Items"])

@router.post(
    "/bulk",
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse,
    description="Add multiple items from local storage migration",
)
async def bulk_add_items(
    items: List[ItemCreate],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(models.User).where(models.User.id == current_user.user_id))
    user = result.scalars().first()
    if not user or not user.business_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User or business not found")

    for item_data in items:
        new_item = models.Item(
            name=item_data.name,
            wash_price=item_data.wash_price or 0,
            iron_price=item_data.iron_price or 0,
            starch_price=item_data.starch_price or 0,
            business_id=user.business_id,
            id_in_browser=item_data.id_in_browser
        )
        db.add(new_item)

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return BaseResponse(message="Items migrated successfully")

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
    result = await db.execute(select(models.User).where(models.User.id == current_user.user_id))
    user = result.scalars().first()
    if not user or not user.business_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    new_item = models.Item(
        name=item.name,
        wash_price=item.wash_price or 0,
        iron_price=item.iron_price or 0,
        starch_price=item.starch_price or 0,
        business_id=user.business_id
    )
    db.add(new_item)
    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    
    return BaseResponse(message="Item created successfully")

@router.get(
    "",
    status_code=status.HTTP_200_OK,
    description="Get all items with pagination",
)
async def get_items(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(12, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term for item name"),
):
    result = await db.execute(select(models.User).where(models.User.id == current_user.user_id))
    user = result.scalars().first()
    if not user or not user.business_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User or business not found")

    base_conditions = [models.Item.business_id == user.business_id]
    if search and search.strip():
        base_conditions.append(models.Item.name.ilike(f"%{search.strip()}%"))

    count_stmt = select(func.count(models.Item.id)).where(*base_conditions)
    total_items = (await db.execute(count_stmt)).scalar() or 0
    total_pages = math.ceil(total_items / limit) if total_items > 0 else 1

    offset = (page - 1) * limit
    items_stmt = (
        select(models.Item)
        .where(*base_conditions)
        .order_by(models.Item.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items_result = await db.execute(items_stmt)
    rows = items_result.scalars().all()

    items = [
        {
            "id": str(row.id),
            "name": row.name,
            "wash_price": row.wash_price,
            "iron_price": row.iron_price,
            "starch_price": row.starch_price,
        }
        for row in rows
    ]

    return BaseResponse(
        message="Items retrieved successfully",
        data={
            "items": items,
            "meta": {
                "page": page,
                "limit": limit,
                "total_items": total_items,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1,
            },
        },
    )

@router.put(
    "/{item_id}",
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse,
    description="Update an item",
)
async def update_item(
    item_id: str,
    item_update: ItemCreate,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(models.User).where(models.User.id == current_user.user_id))
    user = result.scalars().first()
    if not user or not user.business_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User or business not found")

    item_result = await db.execute(select(models.Item).where(models.Item.id == item_id, models.Item.business_id == user.business_id))
    existing_item = item_result.scalars().first()
    if not existing_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    existing_item.name = item_update.name
    existing_item.wash_price = item_update.wash_price or 0
    existing_item.iron_price = item_update.iron_price or 0
    existing_item.starch_price = item_update.starch_price or 0

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return BaseResponse(message="Item updated successfully")

@router.delete(
    "/{item_id}",
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse,
    description="Delete an item",
)
async def delete_item(
    item_id: str,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(models.User).where(models.User.id == current_user.user_id))
    user = result.scalars().first()
    if not user or not user.business_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User or business not found")

    item_result = await db.execute(select(models.Item).where(models.Item.id == item_id, models.Item.business_id == user.business_id))
    existing_item = item_result.scalars().first()
    if not existing_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    await db.delete(existing_item)

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return BaseResponse(message="Item deleted successfully")
