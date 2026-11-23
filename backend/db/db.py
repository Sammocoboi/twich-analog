
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from config.config import get_settings

settings = get_settings()
engine = create_engine(
    settings.db_url,
    settings.connect_args
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()