import uuid
import enum

from datetime import datetime
from typing import List
from sqlalchemy import DateTime, func, Enum, String, UUID, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    OWNER = "owner"
    MANAGER = "manager"
    STAFF = "staff"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(100), index=True, unique=True)
    full_name: Mapped[str] = mapped_column(String(150))
    password_hash: Mapped[str] = mapped_column(String(200))
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False),
        default=UserRole.STAFF,
        nullable=False,
        server_default=UserRole.STAFF.value,
    )

    # Foreign key pointing to the businesses table
    business_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("businesses.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    # Many Users -> One Business relationship
    business: Mapped["Business"] = relationship("Business", back_populates="users")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(50), unique=True)
    phone_number: Mapped[str] = mapped_column(String(14), unique=True)
    address: Mapped[str] = mapped_column(String(200))
    bank_name: Mapped[str] = mapped_column(String(50))
    account_number: Mapped[str] = mapped_column(String(10))
    account_name: Mapped[str] = mapped_column(String(50))
    default_delivery_price: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # One Business -> Many Users relationship
    users: Mapped[List["User"]] = relationship(
        "User", back_populates="business", cascade="all, delete-orphan"
    )
    # One Business -> Many Items relationship
    items: Mapped[List["Item"]] = relationship(
        "Item", back_populates="business", cascade="all, delete-orphan"
    )
    # One business -> Many Customers relationship
    customers: Mapped[List["Customer"]] = relationship(
        "Customer", back_populates="business", cascade="all, delete-orphan"
    )


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(50), unique=True)
    phone_number: Mapped[str] = mapped_column(String(14), unique=True)
    address: Mapped[str] = mapped_column(String(200))

    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True
    )
    business: Mapped["Business"] = relationship("Business", back_populates="customers")
    entries: Mapped[List["Entry"]] = relationship(
        "Entry", back_populates="customer", cascade="all, delete-orphan"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Item(Base):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(50), unique=True)
    wash_price: Mapped[int] = mapped_column(Integer)
    iron_price: Mapped[int] = mapped_column(Integer)
    starch_price: Mapped[int] = mapped_column(Integer)

    business_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), index=True
    )
    business: Mapped["Business"] = relationship("Business", back_populates="items")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Collection_Mode(str, enum.Enum):
    DELIVERY = "delivery"
    PICKUP = "pickup"


class Entry(Base):
    __tablename__ = "entries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    collection_mode: Mapped[Collection_Mode] = mapped_column(
        Enum(Collection_Mode, native_enum=False)
    )

    discount_price: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    delivery_fee: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    paid: Mapped[bool] = mapped_column(Boolean, default=False, server_default="False")

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), index=True
    )
    customer: Mapped["Customer"] = relationship("Customer", back_populates="entries")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# class EntryItem(Base):
#     __tablename__ = "entryitems"

#     id: Mapped[uuid.UUID] = mapped_column(
#         UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
#     )

#     entry_id: Mapped[uuid.UUID] = mapped_column(
#         UUID(as_uuid=True), ForeignKey("entries.id", ondelete="CASCADE"), index=True
#     )
#     item_id: Mapped[uuid.UUID] = mapped_column(
#         UUID(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), index=True
#     )

#     # Store quantity per item in this specific entry
#     quantity: Mapped[int] = mapped_column(Integer, default=1)

#     # Relationships
#     entry: Mapped["Entry"] = relationship("Entry", back_populates="entry_items")
#     item: Mapped["Item"] = relationship("Item", back_populates="entry_items")
