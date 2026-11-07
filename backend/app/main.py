
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.services import router as services_router

app = FastAPI(
    title="Hunarwala API",
    description="Hyperlocal services marketplace",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register services API
app.include_router(services_router)


@app.get("/")
def root():
    return {"message": "Welcome to Hunarwala API"}


@app.get("/health")
def health():
    return {"status": "healthy"}
