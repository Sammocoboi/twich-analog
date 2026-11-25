

from fastapi import APIRouter,Depends
from service.users import UserService,get_cerrent_user
from models.users import UserORM
from schemas.users import UserCreate,UserLogin,UserSchema
from typing import Annotated
router = APIRouter(prefix="/user",tags="user")

Cuerrentuser = Annotated[UserORM,Depends(get_cerrent_user)]

@router.get("/me",response_model=UserSchema)
def get_profile(current_user:Cuerrentuser):
    return current_user

@router.post("/register",response_model=UserSchema)
def register()