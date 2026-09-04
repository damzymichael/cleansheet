from fastapi import APIRouter, Request, status, Depends, HTTPException
from sqlalchemy import func, select
from typing import Annotated
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.base import BaseResponse
from app.schemas.business import BusinessSchema
from app import models
from app.core.auth import CurrentUser, get_current_user

router = APIRouter(prefix="/business", tags=["Business"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse,
    description="Create a new business",
)
async def create_business(
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

    if user.business_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to a business",
        )

    # Check for existing business with the same name or phone
    existing_business = await db.execute(
        select(models.Business).where(
            (func.lower(models.Business.name) == payload.name.lower())
            | (models.Business.phone_number == payload.phone_number)
        )
    )
    if existing_business.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Business with this name or phone number already exists",
        )

    # Create the new business
    new_business = models.Business(
        name=payload.name,
        phone_number=payload.phone_number,
        address=payload.address,
        bank_name=payload.bank_name,
        account_number=payload.account_number,
        account_name=payload.account_name,
        default_delivery_price=payload.default_delivery_price,
    )

    db.add(new_business)

    # Assign the business to the current user
    user.business = new_business

    await db.commit()

    return BaseResponse(message="Business information added successfully")


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    description="Get business information",
    response_model=BaseResponse[BusinessSchema],
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User does not have a business",
        )

    biz_result = await db.execute(
        select(models.Business).where(models.Business.id == user.business_id)
    )
    biz = biz_result.scalars().first()
    if biz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Business not found"
        )

    return BaseResponse(message="Business retrieved successfully", data=biz)


@router.put(
    "",
    status_code=status.HTTP_200_OK,
    description="Update business information",
    response_model=BaseResponse,
)
async def update_business(
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

    if not user.business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User does not have a business",
        )

    if user.role != models.UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can update business details",
        )

    biz_result = await db.execute(
        select(models.Business).where(models.Business.id == user.business_id)
    )
    biz = biz_result.scalars().first()
    if biz is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Business not found"
        )

    # Check for name/phone collision with other businesses
    collision = await db.execute(
        select(models.Business).where(
            (models.Business.id != biz.id)
            & (
                (func.lower(models.Business.name) == payload.name.lower())
                | (models.Business.phone_number == payload.phone_number)
            )
        )
    )
    if collision.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Another business with this name or phone number already exists",
        )

    # Update fields
    biz.name = payload.name
    biz.phone_number = payload.phone_number
    biz.address = payload.address
    biz.bank_name = payload.bank_name
    biz.account_number = payload.account_number
    biz.account_name = payload.account_name
    biz.default_delivery_price = payload.default_delivery_price

    await db.commit()
    await db.refresh(biz)

    return BaseResponse(message="Business information updated successfully")
