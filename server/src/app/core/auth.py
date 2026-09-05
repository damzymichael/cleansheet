from datetime import UTC, datetime, timedelta
import jwt
import secrets
import hashlib
from pydantic import BaseModel

from fastapi import Response, Cookie, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pwdlib import PasswordHash
from typing import Annotated

from app.core.config import settings

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    payload = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(
            minutes=settings.access_token_expire_minutes,
        )
    payload.update({"exp": expire})
    encoded_jwt = jwt.encode(
        payload,
        settings.secret_key.get_secret_value(),
        algorithm=settings.algorithm,
    )
    return encoded_jwt


def generate_refresh_token() -> str:
    # opaque random string, not a JWT — nothing to decode, just look up
    return secrets.token_urlsafe(64)


def hash_token(token: str) -> str:
    # sha256 is fine here: refresh tokens already have 512 bits of entropy,
    # we're hashing so a Redis dump doesn't leak usable tokens
    return hashlib.sha256(token.encode()).hexdigest()


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=int(
            timedelta(minutes=settings.access_token_expire_minutes).total_seconds()
        ),
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=int(timedelta(days=settings.refresh_token_expire_days).total_seconds()),
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/api/auth",  # only sent to /auth/* routes (refresh, logout)
    )


def verify_access_token(token: str) -> str | None:
    """Verify a JWT access token and return the subject (user id) if valid."""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm],
            options={"require": ["exp", "sub"]},
        )
    except jwt.InvalidTokenError:
        return None
    else:
        return payload.get("sub")


def extract_session_id(access_token: str | None) -> str | None:
    if not access_token:
        return None
    try:
        payload = jwt.decode(
            access_token,
            settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm],
            options={"verify_exp": False},  # expired is fine, we just want session_id
        )
        return payload.get("session_id")
    except jwt.PyJWTError:  # Handles all PyJWT decode/signature exceptions
        return None


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/auth")


class CurrentUser(BaseModel):
    user_id: str
    session_id: str


async def get_current_user(
    access_token: Annotated[str | None, Cookie()] = None,
    bearer_credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ] = None,
) -> CurrentUser:
    swagger_token = bearer_credentials.credentials if bearer_credentials else None

    token_to_use = access_token or swagger_token

    if not token_to_use:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = jwt.decode(
            token_to_use,
            settings.secret_key.get_secret_value(),
            algorithms=[settings.algorithm],
        )
    except jwt.PyJWTError:
        # Covers both an expired token and a tampered/invalid one.
        # The frontend should treat any 401 here as "call /auth/refresh".
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong token type"
        )

    return CurrentUser(user_id=payload["sub"], session_id=payload["session_id"])
