from models.users import UserORM
from db.db import get_db
from sqlalchemy import select
from sqlalchemy.orm import Session


class UserSchema:

    def create_