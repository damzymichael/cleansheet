from fastapi import APIRouter, Request, status, Depends, HTTPException
from app.schemas.users import UserSignup, UserSignupData
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from typing import Annotated
from app.schemas.base import BaseResponse
from app import models
from app.core.auth import hash_password

router = APIRouter(prefix="/user", tags=["Users"])
