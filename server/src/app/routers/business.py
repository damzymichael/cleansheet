from fastapi import APIRouter, Request, status, Depends, HTTPException
from sqlalchemy import func, select
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.base import BaseResponse
from app.schemas.business import BusinessSchema, BusinessResponse
from app import models
from app.core.auth import CurrentUser, get_current_user

router = APIRouter(prefix="/business", tags=["Business"])



@router.get(
    "",
    status_code=status.HTTP_200_OK,
    description="Get business information",
    response_model=BaseResponse[BusinessResponse],
)
async def get_business(
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

    if not user.business_id:
        return BaseResponse(
            message="Business not updated",
            data=BusinessResponse(default_delivery_price=0),
        )

    biz_result = await db.execute(
        select(models.Business).where(models.Business.id == user.business_id)
    )
    biz = biz_result.scalars().first()

    if biz is None:
        return BaseResponse(
            message="Business not updated",
            data=BusinessResponse(default_delivery_price=0),
        )

    return BaseResponse(message="Business retrieved successfully", data=biz)


@router.put(
    "",
    status_code=status.HTTP_200_OK,
    description="Create or update business information",
    response_model=BaseResponse,
)
async def upsert_business(
    payload: BusinessSchema,
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

    if user.business_id and user.role != models.UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can update business details",
        )

    # Check for name/phone collision
    query = select(models.Business).where(
        (func.lower(models.Business.name) == payload.name.lower())
        | (models.Business.phone_number == payload.phone_number)
    )
    
    if user.business_id:
        query = query.where(models.Business.id != user.business_id)

    collision = await db.execute(query)
    if collision.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Another business with this name or phone number already exists" if user.business_id else "Business with this name or phone number already exists",
        )

    if user.business_id:
        biz_result = await db.execute(
            select(models.Business).where(models.Business.id == user.business_id)
        )
        biz = biz_result.scalars().first()
        if biz is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Business not found"
            )

        # Update fields
        biz.name = payload.name
        biz.phone_number = payload.phone_number
        biz.address = payload.address
        biz.bank_name = payload.bank_name
        biz.account_number = payload.account_number
        biz.account_name = payload.account_name
        biz.default_delivery_price = payload.default_delivery_price
        
        message = "Business information updated successfully"
    else:
        # Create the new business
        biz = models.Business(
            name=payload.name,
            phone_number=payload.phone_number,
            address=payload.address,
            bank_name=payload.bank_name,
            account_number=payload.account_number,
            account_name=payload.account_name,
            default_delivery_price=payload.default_delivery_price,
        )
        db.add(biz)
        user.business = biz
        
        message = "Business information added successfully"

    await db.commit()

    return BaseResponse(message=message)
