from fastapi import FastAPI,Depends,HTTPException,status
import uvicorn
import os 




from contextlib import asynccontextmanager



from pydantic import BaseModel,ConfigDict,EmailStr,Field

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import (Mapped,Session,mapped_column,DeclarativeBase,sessionmaker)
from fastapi.middleware.cors import CORSMiddleware






# база данных подлкючение создание 












DbSession = Annotated[Session,Depends(get_db)]


#Shecmy 



# создание jwt 



    

# проверка авторизации пользователя
# 



Cuerrentuser = Annotated[UserORM,Depends(get_cerrent_user)]

@asynccontextmanager
async def lifespan(app:FastAPI):
    Base.metadata.create_all(bind=engine)
    yield




app = FastAPI(title="Authenfication API",version="1.0.0",lifespan=lifespan)


# ОТКРЫТЬ ВСЕ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def home():
    return "fsdsfd"

@app.post("/register",response_model=UserResponse,status_code=status.HTTP_201_CREATED)
def register(data:UserCreate, db:DbSession):
    

   
    if existing_user is not None:
        raise HTTPException(
            status_code=409,
            detail="email сущ"
        )
    
    hashed_password=password_hash.hash(data.password)
    new_user = UserORM(
        email=email,
        hashed_password = hashed_password
    )
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email есть"
        )from None

    db.refresh(new_user)

    return new_user


@app.post("/login", response_model=TokenResponse)
def login(, db: DbSession):
    email = form.username.strip().lower()
    user = db.scalar(select(UserORM).where(UserORM.email==email))

    if user is None:
        
    if not password_hash.verify(form.password,user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="неверный логин пароль",
            headers={"WWW-Authenticate":"Bearer"}
        )

    token = create_acces_token(user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer"
    )


@app.get(
    "/me",
    response_model=UserResponse
)
def get_profile(current_user:Cuerrentuser):
    return current_user

if __name__ == "__main__":
    uvicorn.run("main:app",host="127.0.0.1",port=8000,reload=True)