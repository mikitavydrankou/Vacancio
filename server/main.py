from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging

from core.database import check_connection, engine
from core.config import UPLOAD_DIR
from database import models
from routers import profiles, resumes, applications, system

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Vacancio API",
    description="Scrapes job postings from any website and parses them with AI",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.include_router(profiles.router, prefix="/profiles", tags=["Profiles"])
app.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
app.include_router(applications.router, prefix="/applications", tags=["Applications"])
app.include_router(system.router, prefix="/system", tags=["System"])

@app.on_event("startup")
async def startup():
    check_connection()
    logger.info("🚀 Server started successfully")

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": "Vacancio API",
        "version": "2.0.0",
        "docs": "/docs"
    }
