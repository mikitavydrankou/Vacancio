from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from core.config import settings

class Base(DeclarativeBase):
    pass

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_connection():
    try:
        with engine.connect() as conn:
            if "sqlite" in settings.DATABASE_URL:
                conn.execute(text("SELECT 1"))
            else:
                conn.execute(text("SELECT 1"))
            print(f"✅ Connected to database: {settings.DATABASE_URL}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
