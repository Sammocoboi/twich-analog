
from sqlalchemy.orm import mapped_column,Mapped
from sqlalchemy import String
from .base import Base

class UserORM(Base):
    __tablename__="users"

    
    email:Mapped[str] = mapped_column(String(320),unique=True,index=True)
    hashed_password:Mapped[str] = mapped_column(String(255))