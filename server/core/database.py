from sqlalchemy import create_engine
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
        with engine.connect() as connection:
            print(f"✅ Connected to database: {settings.DATABASE_URL}")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

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
            if engine.name == 'sqlite':
                result = conn.execute(text("SELECT sqlite_version()"))
            else:
                result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"Success connection to db: {version}")
            return True
    except Exception as e:
        print(f"Error connecting to DB: {e}")
        return False
