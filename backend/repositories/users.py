from models.users import UserORM
from db.db import get_db
from sqlalchemy import select
from sqlalchemy.orm import Session


class UserRepositories:
    def __init__(self,db:Session):
        self.db=db
    
    def create_by_email(self,email:str,password:str)->UserORM:
        user = UserORM(email=email,hashed_password=password)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def get_user_is_email(self,email:str)->UserORM:
       
        return self.db.get(UserORM,email)
        
    