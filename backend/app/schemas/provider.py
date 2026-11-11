from pydantic import BaseModel, Field


class ProviderRegisterRequest(BaseModel):
    city: str = "Bhopal"
    bio: str = Field(min_length=20, max_length=1000)
    experience_years: int = Field(ge=0, le=50)
    service_ids: list[int] = Field(min_length=1)
