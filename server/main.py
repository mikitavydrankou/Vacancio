from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging

from core.database import check_connection, engine
from core.config import settings
from core.migration import migrate_data
from database import models
from routers import profiles, resumes, applications
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Check for legacy data and migrate if needed
    migrate_data(
        data_dir=settings.DATA_DIR,
        legacy_db_path="vacancio.db",
        legacy_uploads_path="uploads"
    )
    
    check_connection()
    models.Base.metadata.create_all(bind=engine)
    logger.info("🚀 Server started successfully")
    yield

app = FastAPI(
    title="Vacancio API",
    description="Scrapes job postings from any website and parses them with AI",
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
app.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
app.include_router(applications.router, prefix="/applications", tags=["Applications"])

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": "Vacancio API",
        "version": "2.0.0",
        "docs": "/docs"
    }
