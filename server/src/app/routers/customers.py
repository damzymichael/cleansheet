import math
from fastapi import APIRouter, status, Depends, HTTPException, Query
from typing import Annotated, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
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
    description="Get all customers with pagination",
)
async def get_customers(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(
        None, description="Search term for name or phone"),
):
    result = await db.execute(select(models.User).where(models.User.id == current_user.user_id))
    user = result.scalars().first()
    if not user or not user.business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User or business not found"
        )

    base_conditions = [models.Customer.business_id == user.business_id]
    if search and search.strip():
        term = f"%{search.strip()}%"
        base_conditions.append(
            or_(
                models.Customer.name.ilike(term),
                models.Customer.phone_number.ilike(term),
            )
        )

    count_stmt = select(func.count(models.Customer.id)).where(*base_conditions)
    total_items = (await db.execute(count_stmt)).scalar() or 0
    total_pages = math.ceil(total_items / limit) if total_items > 0 else 1

    offset = (page - 1) * limit
    customers_stmt = (
        select(
            models.Customer.id,
            models.Customer.name,
            models.Customer.phone_number,
            models.Customer.address,
            models.Customer.id_in_browser,
        )
        .where(*base_conditions)
        .order_by(models.Customer.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    customers_result = await db.execute(customers_stmt)
    rows = customers_result.all()

    customers = [
        {
            "id": row.id,
            "name": row.name,
            "phone_number": row.phone_number,
            "address": row.address,
            "id_in_browser": row.id_in_browser,
            "number_of_entries": 0,
            "total_value": 0,
        }
        for row in rows
    ]

    return BaseResponse(
        message="Customers retrieved successfully",
        data={
            "items": customers,
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

    return BaseResponse(message="Customer deleted successfully")
