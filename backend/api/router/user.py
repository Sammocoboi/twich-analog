

from fastapi import APIRouter,Depends
from service.users import UserService,get_cerrent_user
from models.users import UserORM
from schemas.users import UserCreate,UserLogin,UserSchema
from typing import Annotated
from ..dependecies import get_user_service
router = APIRouter(prefix="/user",tags=["user"])

Cuerrentuser = Annotated[UserSchema,Depends(get_cerrent_user)]

@router.get("/me",response_model=UserSchema)
def get_profile(current_user:Cuerrentuser):
    return current_user

@router.post("/register",response_model=UserSchema)
def register(register_user:UserCreate,users:UserService=Depends(get_user_service))->UserSchema:
    print(register_user)
    print(users)
    return users.create_user(register_user)

@router.post("/login",response_model=UserSchema)
def login(login_user:UserLogin,users:UserService=Depends(get_user_service))->UserSchema:
    return users.login_user(login_user)

