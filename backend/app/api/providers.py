from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.provider import ProviderRegisterRequest

router = APIRouter(prefix="/api/providers", tags=["Professionals"])


@router.post("/register", status_code=201)
def register_provider(
    data: ProviderRegisterRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] == "professional":
        raise HTTPException(status_code=409, detail="Already registered")

    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Customer account required")

    existing = db.execute(
        text("SELECT id FROM providers WHERE user_id = :user_id"),
        {"user_id": current_user["id"]},
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="Profile already exists")

    service_ids = list(set(data.service_ids))

    services = db.execute(
        text("""
            SELECT id FROM services
            WHERE id = ANY(:service_ids) AND is_active = TRUE
        """),
        {"service_ids": service_ids},
    ).scalars().all()

    if len(services) != len(service_ids):
        raise HTTPException(status_code=400, detail="Invalid service IDs")

    try:
        provider = db.execute(
            text("""
                INSERT INTO providers
                (user_id, full_name, phone, city, bio, experience_years)
                VALUES
                (:user_id, :full_name, :phone, :city, :bio, :experience)
                RETURNING id, user_id, full_name, phone, city, bio,
                          experience_years, is_verified
            """),
            {
                "user_id": current_user["id"],
                "full_name": current_user["full_name"],
                "phone": current_user["phone"],
                "city": data.city.strip(),
                "bio": data.bio.strip(),
                "experience": data.experience_years,
            },
        ).mappings().first()

        for service_id in service_ids:
            db.execute(
                text("""
                    INSERT INTO provider_services (provider_id, service_id)
                    VALUES (:provider_id, :service_id)
                """),
                {
                    "provider_id": provider["id"],
                    "service_id": service_id,
                },
            )

        db.execute(
            text("UPDATE users SET role = 'professional' WHERE id = :user_id"),
            {"user_id": current_user["id"]},
        )

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Professional registration successful",
        "provider": dict(provider),
        "service_ids": service_ids,
    }
