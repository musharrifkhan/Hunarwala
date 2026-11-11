
from datetime import datetime, timezone
import os

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    user = db.execute(
        text("""
            SELECT id, full_name, phone, email, role
            FROM users
            WHERE id = :user_id
              AND is_active = TRUE
        """),
        {"user_id": user_id},
    ).mappings().first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User account not found or inactive",
        )

    return dict(user)
