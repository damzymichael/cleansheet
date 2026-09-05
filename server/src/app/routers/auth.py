import uuid
from datetime import datetime, timedelta, timezone, UTC
from fastapi import APIRouter, Request, Response, status, Depends, HTTPException, Cookie

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from typing import Annotated

from app import models
from app.schemas.base import BaseResponse
from app.core.auth import (
    hash_password,
    verify_password,
    generate_refresh_token,
    create_access_token,
    hash_token,
    set_auth_cookies,
    extract_session_id,
    clear_auth_cookies,
    get_current_user,
    CurrentUser,
)
from app.core.redis import get_redis
from app.core.config import settings
from app.core.database import get_db
from app.schemas.users import UserSignup, UserSignupData, UserLogin

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/signup",
    response_model=BaseResponse[UserSignupData],
    status_code=status.HTTP_201_CREATED,
    description="New user signup endpoint",
)
async def sign_up(user: UserSignup, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(models.User).where(func.lower(models.User.email) == user.email.lower()),
    )
    existing_email = result.scalars().first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    new_user = models.User(
        full_name=user.full_name,
        email=user.email.lower(),
        password_hash=hash_password(user.password),
        role=models.UserRole.OWNER,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return BaseResponse(
        message="Account created successfully, sign in to continue",
        data=UserSignupData(email=new_user.email),
    )


@router.post(
    "/login",
    response_model=BaseResponse,
    status_code=status.HTTP_201_CREATED,
    description="Login endpoint",
)
async def login(
    payload: UserLogin,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    redis=Depends(get_redis),
):
    # Look up user by email (case-insensitive)
    # Note: OAuth2PasswordRequestForm uses "username" field, but we treat it as email
    result = await db.execute(
        select(models.User).where(
            func.lower(models.User.email) == payload.email.lower(),
        ),
    )
    user = result.scalars().first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    session_id = str(uuid.uuid4())
    refresh_token = generate_refresh_token()
    access_token = create_access_token(
        {"sub": str(user.id), "session_id": session_id, "type": "access"}
    )

    session_key = f"session:{session_id}"
    user_sessions_key = f"user_sessions:{user.id}"

    await redis.hset(
        session_key,
        mapping={
            "user_id": str(user.id),
            "refresh_hash": hash_token(refresh_token),
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    await redis.expire(
        session_key,
        int(timedelta(days=settings.refresh_token_expire_days).total_seconds()),
    )
    await redis.sadd(user_sessions_key, session_id)
    await redis.set(
        f"refresh_lookup:{hash_token(refresh_token)}",
        session_id,
        ex=int(timedelta(days=settings.refresh_token_expire_days).total_seconds()),
    )
    set_auth_cookies(response, access_token, refresh_token)

    return BaseResponse(message="Login successful")


@router.post("/logout", response_model=BaseResponse, status_code=status.HTTP_200_OK)
async def logout(
    request: Request,
    response: Response,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    redis=Depends(get_redis),
):
    access_token = request.cookies.get("access_token")
    session_id = extract_session_id(access_token)

    if session_id:
        session_key = f"session:{session_id}"
        session = await redis.hgetall(session_key)

        if session:
            user_id = session.get("user_id")
            await redis.delete(session_key)
            if user_id:
                await redis.srem(f"user_sessions:{user_id}", session_id)

    # Always clear cookies, even if there was no valid session to revoke —
    # the client should never end up "logged out" in Redis but still holding cookies.
    clear_auth_cookies(response)

    return BaseResponse(message="Logout successful")


# Refresh token
@router.post(
    "/refresh",
    response_model=BaseResponse,
    status_code=status.HTTP_200_OK,
    description="Generate new auth tokens",
)
async def refresh_token(
    response: Response,
    refresh_token: Annotated[str | None, Cookie()] = None,
    redis=Depends(get_redis),
):
    if refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token"
        )

    # We don't know the session_id up front (refresh_token is opaque, not a JWT),
    # so we look sessions up by the hash of the incoming token.
    incoming_hash = hash_token(refresh_token)
    session_id = await redis.get(f"refresh_lookup:{incoming_hash}")
    print({"session_id": session_id})

    if session_id is None:
        # Either never existed, already rotated away, or expired.
        # Could also mean token reuse (stolen + already used) — see note below.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session"
        )

    session_key = f"session:{session_id}"
    session = await redis.hgetall(session_key)

    print(session)
    print(session.get("refresh_hash"))

    if not session or session.get("refresh_hash") != incoming_hash:
        # Session got deleted (logged out / revoked) between the lookup key
        # existing and now, or hashes disagree somehow — reject either way.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session"
        )

    user_id = session["user_id"]

    # --- rotate ---
    new_refresh_token = generate_refresh_token()
    new_hash = hash_token(new_refresh_token)

    new_access_token = create_access_token(
        {"sub": str(user_id), "session_id": session_id, "type": "access"}
    )

    ttl = int(timedelta(days=settings.refresh_token_expire_days).total_seconds())

    # Remove the old lookup key so the used-up refresh token can never work again,
    # write the new one, and update the session record + reset its TTL (sliding expiry).
    await redis.delete(f"refresh_lookup:{incoming_hash}")
    await redis.set(f"refresh_lookup:{new_hash}", session_id, ex=ttl)
    await redis.hset(session_key, "refresh_hash", new_hash)
    await redis.hset(
        session_key, "last_refreshed_at", datetime.now(timezone.utc).isoformat()
    )
    await redis.expire(session_key, ttl)

    set_auth_cookies(response, new_access_token, new_refresh_token)

    return BaseResponse(message="Token refreshed successfully")
