from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_USERNAME = os.getenv('DATABASE_USERNAME')
DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD')
DATABASE_NAME = os.getenv('DATABASE_NAME')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')

if DB_HOST == 'localhost' or DB_HOST == '127.0.0.1' or not DB_HOST:
    DATABASE_URL = "sqlite:///./vacancio.db"
else:
    DATABASE_URL = f"postgresql://{DATABASE_USERNAME}:{DATABASE_PASSWORD}@{DB_HOST}:{DB_PORT}/{DATABASE_NAME}"

if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}, 
        echo=True
    )
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=True)
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
