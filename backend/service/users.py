from repositories.users import UserRepositories
from schemas.users import UserCreate,UserSchema,UserLogin
from sqlalchemy.orm import Session
from jwt.exceptions import InvalidTokenError
from schemas.token import TokenSchema
import jwt
from models.users import UserORM

from schemas.token import TokenSchema
from typing import Annotated
from pwdlib import PasswordHash
from fastapi.security import OAuth2PasswordBearer,OAuth2PasswordRequestForm
from fastapi import HTTPException,status,Depends
from datetime import datetime,timedelta,timezone
from config.config import get_settings
from db.db import get_db
settings = get_settings()
password_hash = PasswordHash.recommended()

oauth2_cheme = OAuth2PasswordBearer(tokenUrl="/login")
def create_acces_token(user_id:int)->str:
    expire = datetime.now(timezone.utc)+timedelta(
        minutes=settings.acess_token_expire_minutes
    )
    payload = {
        "sub":str(user_id),
        "exp":expire
    }

    token = jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.algorithm
    )
    return token


def get_cerrent_user(token:Annotated[str,Depends(oauth2_cheme)],db:Session = Depends(get_db))-> UserORM:

    error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="недействительный токен или просрочен",
        headers={"WWW-Authenticate":"Bearer"}
    )
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            options={"require":["sub","exp"]}
        )
        user_id = int(payload["sub"])

    except (InvalidTokenError,ValueError,TypeError):
        raise error from None

    user = db.get(UserORM,user_id)

    if user is None:
        raise error
    return user 

Cuerrentuser = Annotated[UserORM,Depends(get_cerrent_user)]

class UserService:
    def __init__(self,db:Session):
        self.db = db
        self.user_repository=UserRepositories(db)


    
    def create_user(self,user:UserCreate)->UserSchema:
        email = str(user.email).strip().lower()
        print(email)
        if self.user_repository.get_user_is_email(email=user.email) is not None:
            raise HTTPException(
                    status_code=409,
                    detail="email сущ"
                    
                    )
        
        password_hashed = password_hash.hash(user.password)
        new_user = self.user_repository.create_by_email(email=email,password=password_hashed)
        self.db.commit()

        return UserSchema.model_validate(new_user)

    def login_user(self,form: OAuth2PasswordRequestForm) -> TokenSchema:
        email = form.username.strip().lower()
        users=self.user_repository.get_user_is_email(email=email)
        if users is None:
            password_hash.verify(form.password,password_hash.hash("dummy"))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="неверный логин пароль",
                headers={"WWW-Authenticate":"Bearer"}
            )
        if not password_hash.verify(form.password, users.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="неверный логин или пароль",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token = create_acces_token(users.id)

        return TokenSchema(
            access_token=token,
            token_type="bearer"
        )
    def get_profile(current_user:Cuerrentuser):
        return current_user