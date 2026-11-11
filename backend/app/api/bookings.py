
from datetime import date, time, datetime
import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user

router = APIRouter(prefix="/api", tags=["Bookings"])

optional_bearer = HTTPBearer(auto_error=False)


class BookingCreate(BaseModel):
    service_id: int
    customer_name: str | None = Field(default=None, min_length=2, max_length=150)
    customer_phone: str | None = Field(default=None, min_length=10, max_length=15)
    address: str = Field(min_length=5)
    booking_date: date
    booking_time: time
    notes: str | None = None


class BookingStatusUpdate(BaseModel):
    status: str


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: Session = Depends(get_db),
):
    if credentials is None:
        return None

    secret_key = os.getenv("JWT_SECRET")

    try:
        payload = jwt.decode(
            credentials.credentials,
            secret_key,
            algorithms=["HS256"],
        )
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.execute(
        text("""
            SELECT id, full_name, phone, role
            FROM users
            WHERE id = :user_id AND is_active = TRUE
        """),
        {"user_id": user_id},
    ).mappings().first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return dict(user)


# CREATE BOOKING
@router.post("/bookings", status_code=201)
def create_booking(
    booking: BookingCreate,
    db: Session = Depends(get_db),
    current_user: dict | None = Depends(get_optional_user),
):
    service = db.execute(
        text("""
            SELECT id FROM services
            WHERE id = :service_id AND is_active = TRUE
        """),
        {"service_id": booking.service_id},
    ).first()

    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    if current_user:
        customer_name = current_user["full_name"]
        customer_phone = current_user["phone"]
    else:
        if not booking.customer_name or not booking.customer_phone:
            raise HTTPException(
                status_code=400,
                detail="Customer name and phone required",
            )
        customer_name = booking.customer_name
        customer_phone = booking.customer_phone

    booking_datetime = datetime.combine(
        booking.booking_date,
        booking.booking_time,
    )

    result = db.execute(
        text("""
            INSERT INTO bookings (
                service_id, customer_name, customer_phone,
                address, booking_date, notes
            )
            VALUES (
                :service_id, :customer_name, :customer_phone,
                :address, :booking_date, :notes
            )
            RETURNING id, status, created_at
        """),
        {
            "service_id": booking.service_id,
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "address": booking.address,
            "booking_date": booking_datetime,
            "notes": booking.notes,
        },
    ).mappings().first()

    db.commit()

    return {
        "message": "Booking created successfully",
        "booking": dict(result),
    }


# CUSTOMER BOOKINGS
@router.get("/bookings")
def get_customer_bookings(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = db.execute(
        text("""
            SELECT b.id, b.service_id, s.name AS service_name,
                s.slug AS service_slug, s.base_price, s.price_unit,
                c.name AS category, b.customer_name, b.customer_phone,
                b.address, b.booking_date, b.status, b.notes, b.created_at
            FROM bookings b
            JOIN services s ON s.id = b.service_id
            JOIN service_categories c ON c.id = s.category_id
            WHERE b.customer_phone = :phone
            ORDER BY b.created_at DESC
        """),
        {"phone": current_user["phone"]},
    ).mappings().all()

    return {
        "count": len(result),
        "bookings": [dict(row) for row in result],
    }


# PROFESSIONAL BOOKINGS
@router.get("/professional/bookings")
def get_professional_bookings(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "professional":
        raise HTTPException(status_code=403, detail="Professional account required")

    provider = db.execute(
        text("SELECT id FROM providers WHERE user_id = :user_id"),
        {"user_id": current_user["id"]},
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Professional profile not found")

    result = db.execute(
        text("""
            SELECT b.id, s.name AS service_name, b.customer_name,
                b.customer_phone, b.address, b.booking_date,
                b.status, b.notes, b.created_at
            FROM bookings b
            JOIN services s ON s.id = b.service_id
            JOIN provider_services ps ON ps.service_id = b.service_id
            WHERE ps.provider_id = :provider_id
            ORDER BY b.created_at DESC
        """),
        {"provider_id": provider.id},
    ).mappings().all()

    return {
        "count": len(result),
        "bookings": [dict(row) for row in result],
    }


# UPDATE BOOKING STATUS
@router.patch("/professional/bookings/{booking_id}/status")
def update_booking_status(
    booking_id: int,
    data: BookingStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "professional":
        raise HTTPException(status_code=403, detail="Professional account required")

    allowed_statuses = {
        "pending": ["accepted", "rejected"],
        "accepted": ["completed"],
    }

    provider = db.execute(
        text("SELECT id FROM providers WHERE user_id = :user_id"),
        {"user_id": current_user["id"]},
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Professional profile not found")

    booking = db.execute(
        text("""
            SELECT b.id, b.status, b.service_id
            FROM bookings b
            JOIN provider_services ps ON ps.service_id = b.service_id
            WHERE b.id = :booking_id
              AND ps.provider_id = :provider_id
        """),
        {
            "booking_id": booking_id,
            "provider_id": provider.id,
        },
    ).mappings().first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    new_status = data.status.lower()

    if new_status not in allowed_statuses.get(booking["status"], []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change {booking['status']} to {new_status}",
        )

    db.execute(
        text("UPDATE bookings SET status = :status WHERE id = :booking_id"),
        {"status": new_status, "booking_id": booking_id},
    )

    db.commit()

    return {
        "message": "Booking status updated",
        "booking_id": booking_id,
        "status": new_status,
    }
