import logging
from fastapi import APIRouter, status, Depends, HTTPException
from typing import Annotated, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.schemas.base import BaseResponse
from app.schemas.entry import EntryCreate, EntryResponse
from app import models
from app.core.auth import CurrentUser, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/entries", tags=["Entries"])


@router.post(
    "/bulk",
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse,
    description="Add multiple entries from local storage migration",
)
async def bulk_add_entries(
    entries: List[EntryCreate],
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    logger.info("Incoming bulk entries payload: %s",
                [e.model_dump() for e in entries])
    result = await db.execute(select(models.User).where(models.User.id == current_user.user_id))
    user = result.scalars().first()
    if not user or not user.business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User or business not found"
        )

    # Pre-fetch all customers for this business to quickly map customer_name -> customer
    cust_res = await db.execute(
        select(models.Customer).where(
            models.Customer.business_id == user.business_id)
    )
    all_customers = cust_res.scalars().all()
    customers_by_name = {}
    for c in all_customers:
        customers_by_name[c.name.strip().lower()] = c
        customers_by_name[c.name.strip().rstrip(".").strip().lower()] = c
        customers_by_name[c.name.replace(".", "").strip().lower()] = c
    customers_by_browser_id = {
        c.id_in_browser: c for c in all_customers if c.id_in_browser is not None}

    # Pre-fetch all items for this business to quickly map cloth_name/id -> item
    item_res = await db.execute(
        select(models.Item).where(models.Item.business_id == user.business_id)
    )
    all_items = item_res.scalars().all()
    items_by_name = {i.name.strip().lower(): i for i in all_items}
    items_by_uuid = {str(i.id): i for i in all_items}
    items_by_browser_id = {
        i.id_in_browser: i for i in all_items if i.id_in_browser is not None}

    # Check for already migrated entries by id_in_browser to avoid duplicates
    existing_browser_ids = set()
    browser_ids_in_payload = [
        e.id_in_browser for e in entries if e.id_in_browser is not None]
    if browser_ids_in_payload:
        existing_res = await db.execute(
            select(models.Entry.id_in_browser)
            .join(models.Customer)
            .where(
                models.Customer.business_id == user.business_id,
                models.Entry.id_in_browser.in_(browser_ids_in_payload),
            )
        )
        existing_browser_ids = set(existing_res.scalars().all())

    # ===== TEMP MIGRATION FIX START (remove after migration) =====
    CUSTOMER_NAME_FIXES = {
        "mr. tuky": "Master Tuky",
        "mr afeez opeyemi.": "Mr Afeez Opeyemi",
    }
    # ===== TEMP MIGRATION FIX END =====

    for entry_data in entries:
        # Skip if already migrated
        if entry_data.id_in_browser is not None and entry_data.id_in_browser in existing_browser_ids:
            continue

        # ===== TEMP MIGRATION FIX START (remove after migration) =====
        entry_data.customer_name = CUSTOMER_NAME_FIXES.get(
            entry_data.customer_name.strip().lower(),
            entry_data.customer_name,
        )
        # ===== TEMP MIGRATION FIX END =====

        # Find customer (stripping fullstops if present)
        clean_name = entry_data.customer_name.strip().lower()
        dot_stripped_name = entry_data.customer_name.strip().rstrip(".").strip().lower()
        dot_removed_name = entry_data.customer_name.replace(
            ".", "").strip().lower()

        customer = (
            customers_by_name.get(clean_name)
            or customers_by_name.get(dot_stripped_name)
            or customers_by_name.get(dot_removed_name)
        )
        if not customer and entry_data.id_in_browser and entry_data.id_in_browser in customers_by_browser_id:
            customer = customers_by_browser_id[entry_data.id_in_browser]

        if not customer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Customer '{entry_data.customer_name}' not found. Please ensure all customers are migrated first."
            )

        new_entry = models.Entry(
            collection_mode=entry_data.collection_mode,
            discount_price=entry_data.discount_price,
            delivery_fee=entry_data.delivery_fee,
            paid=entry_data.paid,
            customer_id=customer.id,
            due_date=entry_data.due_date,
            id_in_browser=entry_data.id_in_browser,
        )
        if entry_data.created_at:
            new_entry.created_at = entry_data.created_at

        db.add(new_entry)
        await db.flush()

        for item_data in entry_data.items:
            # Find item
            item = None
            if item_data.cloth_id:
                if item_data.cloth_id in items_by_uuid:
                    item = items_by_uuid[item_data.cloth_id]
                elif item_data.cloth_id.isdigit() and int(item_data.cloth_id) in items_by_browser_id:
                    item = items_by_browser_id[int(item_data.cloth_id)]

            if not item:
                item = items_by_name.get(item_data.cloth_name.strip().lower())

            if not item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Clothing item '{item_data.cloth_name}' not found. Please ensure all clothes are migrated first."
                )

            # In localStorage, entry items only have washing price, so tick only wash
            new_entry_item = models.EntryItem(
                entry_id=new_entry.id,
                item_id=item.id,
                quantity=item_data.quantity,
                wash=True,
                iron=False,
                starch=False,
            )
            db.add(new_entry_item)

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return BaseResponse(message="Entries migrated successfully")


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse,
    description="Get all entries for the business",
)
async def get_entries(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(models.User).where(models.User.id == current_user.user_id))
    user = result.scalars().first()
    if not user or not user.business_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User or business not found"
        )

    stmt = (
        select(models.Entry)
        .join(models.Customer)
        .where(models.Customer.business_id == user.business_id)
        .options(
            selectinload(models.Entry.customer),
            selectinload(models.Entry.entry_items).selectinload(
                models.EntryItem.item),
        )
        .order_by(models.Entry.created_at.desc())
    )
    entries_result = await db.execute(stmt)
    entries = entries_result.scalars().all()

    formatted_entries = []
    for entry in entries:
        subtotal = 0
        items_list = []
        for ei in entry.entry_items:
            unit_price = 0
            if ei.wash:
                unit_price += ei.item.wash_price
            if ei.iron:
                unit_price += ei.item.iron_price
            if ei.starch:
                unit_price += ei.item.starch_price

            line_price = unit_price * ei.quantity
            subtotal += line_price
            items_list.append({
                "id": str(ei.id),
                "item_id": str(ei.item_id),
                "cloth_name": ei.item.name,
                "quantity": ei.quantity,
                "wash": ei.wash,
                "iron": ei.iron,
                "starch": ei.starch,
                "price": line_price,
            })

        total_price = subtotal - entry.discount_price + entry.delivery_fee
        if total_price < 0:
            total_price = 0

        formatted_entries.append({
            "id": str(entry.id),
            "customer_name": entry.customer.name,
            "customer_id": str(entry.customer_id),
            "items": items_list,
            "due_date": entry.due_date.isoformat() if entry.due_date else None,
            "collection_mode": entry.collection_mode.value if hasattr(entry.collection_mode, "value") else str(entry.collection_mode),
            "delivery_fee": entry.delivery_fee,
            "discount_price": entry.discount_price,
            "paid": entry.paid,
            "price": total_price,
            "id_in_browser": entry.id_in_browser,
            "created_at": entry.created_at.isoformat() if entry.created_at else None,
        })

    return BaseResponse(message="Entries retrieved successfully", data=formatted_entries)
