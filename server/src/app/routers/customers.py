from fastapi import APIRouter, status, Depends, HTTPException
from typing import Annotated, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.schemas.base import BaseResponse
from app.schemas.customers import CustomerCreate
from app import models
from app.core.auth import CurrentUser, get_current_user

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post(
    "/bulk",
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse,
    description="Add multiple customers from local storage migration",
)
async def bulk_add_customers(
    customers: List[CustomerCreate],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(models.User).where(models.User.id == current_user.user_id))
    user = result.scalars().first()
    if not user or not user.business_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="User or business not found")

    # Simple deduplication by id_in_browser or phone number could be done here,
    # but for migration, we assume unique entries or rely on phone_number unique constraint if needed.
    # To handle potential unique constraint errors on phone_number/name, we might need to handle exceptions.

    for customer_data in customers:
        new_customer = models.Customer(
            name=customer_data.name,
            phone_number=customer_data.phone_number,
            address=customer_data.address,
            id_in_browser=customer_data.id_in_browser,
            business_id=user.business_id
        )
        db.add(new_customer)

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return BaseResponse(message="Customers migrated successfully")


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse,
    description="Add a new customer",
)
async def add_customer(
    customer: CustomerCreate,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(models.User).where(models.User.id == current_user.user_id))
    user = result.scalars().first()
    if not user or not user.business_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="User or business not found")

    new_customer = models.Customer(
        name=customer.name,
        phone_number=customer.phone_number,
        address=customer.address,
        business_id=user.business_id
    )
    db.add(new_customer)

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return BaseResponse(message="Customer added successfully")


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    description="Get all customers",
)
async def get_customers(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(models.User).where(models.User.id == current_user.user_id))
    user = result.scalars().first()
    if not user or not user.business_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="User or business not found")

    customers_result = await db.execute(select(models.Customer).where(models.Customer.business_id == user.business_id))
    customers = customers_result.scalars().all()

    return customers


@router.put(
    "/{customer_id}",
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse,
    description="Update a customer",
)
async def update_customer(
    customer_id: str,
    customer_update: CustomerCreate,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(models.User).where(models.User.id == current_user.user_id))
    user = result.scalars().first()
    if not user or not user.business_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="User or business not found")

    cust_result = await db.execute(select(models.Customer).where(models.Customer.id == customer_id, models.Customer.business_id == user.business_id))
    existing_customer = cust_result.scalars().first()
    if not existing_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    existing_customer.name = customer_update.name
    existing_customer.phone_number = customer_update.phone_number
    existing_customer.address = customer_update.address

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return BaseResponse(message="Customer details updated successfully")


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse,
    description="Delete a customer",
)
async def delete_customer(
    customer_id: str,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(models.User).where(models.User.id == current_user.user_id))
    user = result.scalars().first()
    if not user or not user.business_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="User or business not found")

    cust_result = await db.execute(select(models.Customer).where(models.Customer.id == customer_id, models.Customer.business_id == user.business_id))
    existing_customer = cust_result.scalars().first()
    if not existing_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    await db.delete(existing_customer)

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return {"message": "Customer deleted successfully"}
