"""Application configuration"""
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vacancio API"
    VERSION: str = "2.0.0"

    # Data persistency
    DATA_DIR: str = "data"
    
    # Database
    # Use SQLite in the data directory
    DATABASE_URL: str = "sqlite:///data/vacancio.db"
    
    # Uploads
    UPLOAD_DIR: str = "data/uploads"
    
    # Security
    SECRET_KEY: str = "changeme"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore"
    )

settings = Settings()

# Ensure data and upload directories exist
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

