
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db

router = APIRouter(
    prefix="/api",
    tags=["Services"],
)


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    query = text("""
        SELECT id, name, slug, icon, description
        FROM service_categories
        WHERE is_active = TRUE
        ORDER BY name
    """)

    result = db.execute(query).mappings().all()

    return {
        "count": len(result),
        "categories": [dict(row) for row in result],
    }



@router.get("/services")
def get_services(
    search: str | None = Query(default=None, max_length=100),
    category: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
):
    sql = """
        SELECT
            s.id,
            s.name,
            s.slug,
            s.description,
            s.base_price,
            s.price_unit,
            c.name AS category,
            c.slug AS category_slug
        FROM services s
        JOIN service_categories c ON c.id = s.category_id
        WHERE s.is_active = TRUE
          AND c.is_active = TRUE
    """

    params = {}

    if search and search.strip():
        sql += """
            AND (
                s.name ILIKE :search
                OR COALESCE(s.description, '') ILIKE :search
            )
        """
        params["search"] = f"%{search.strip()}%"

    if category and category.strip():
        sql += " AND c.slug = :category"
        params["category"] = category.strip()

    sql += " ORDER BY s.name"

    result = db.execute(
        text(sql),
        params,
    ).mappings().all()

    return {
        "count": len(result),
        "services": [dict(row) for row in result],
    }


@router.get("/services/{service_slug}")
def get_service(
    service_slug: str,
    db: Session = Depends(get_db),
):
    query = text("""
        SELECT
            s.id,
            s.name,
            s.slug,
            s.description,
            s.base_price,
            s.price_unit,
            c.name AS category,
            c.slug AS category_slug
        FROM services s
        JOIN service_categories c ON c.id = s.category_id
        WHERE s.slug = :slug
          AND s.is_active = TRUE
          AND c.is_active = TRUE
    """)

    result = db.execute(
        query,
        {"slug": service_slug},
    ).mappings().first()

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Service not found",
        )

    return dict(result)

@router.get("/debug/services")
def debug_services(db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("SELECT id, name, slug FROM services ORDER BY name")
        ).mappings().all()

        return {
            "success": True,
            "count": len(result),
            "services": [dict(row) for row in result],
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }

