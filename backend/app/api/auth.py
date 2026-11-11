
from datetime import datetime, timedelta, timezone
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from jose import jwt
from pwdlib import PasswordHash

from app.core.database import get_db
from app.schemas.auth import SignupRequest, LoginRequest

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

password_hash = PasswordHash.recommended()

SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET is missing in backend/.env")

ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60


def create_access_token(user_id: int):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/signup", status_code=201)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    hashed_password = password_hash.hash(data.password)

    try:
        result = db.execute(
            text("""
                INSERT INTO users
                (full_name, phone, email, password_hash)
                VALUES (:full_name, :phone, :email, :password_hash)
                RETURNING id, full_name, phone, email, role
            """),
            {
                "full_name": data.full_name.strip(),
                "phone": data.phone.strip(),
                "email": str(data.email).lower() if data.email else None,
                "password_hash": hashed_password,
            },
        ).mappings().first()

        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Phone number or email already registered",
        )

    return {
        "message": "Account created successfully",
        "user": dict(result),
    }


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.execute(
        text("""
            SELECT id, full_name, phone, email, password_hash, role
            FROM users
            WHERE phone = :phone AND is_active = TRUE
        """),
        {"phone": data.phone.strip()},
    ).mappings().first()

    if not user or not password_hash.verify(
        data.password, user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid phone number or password",
        )

    token = create_access_token(user["id"])

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "phone": user["phone"],
            "email": user["email"],
            "role": user["role"],
        },
    }


