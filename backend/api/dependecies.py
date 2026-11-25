from sqlalchemy.orm import Session
from db.db import get_db
from fastapi import Depends
from service.users import UserService

def get_user_service(db:Session=Depends(get_db)):
    return UserService(db)