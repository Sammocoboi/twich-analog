from fastapi import FastAPI,Depends,HTTPException,status
import uvicorn
import os 



from models.base import Base
from contextlib import asynccontextmanager



from pydantic import BaseModel,ConfigDict,EmailStr,Field

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import (Mapped,Session,mapped_column,DeclarativeBase,sessionmaker)
from fastapi.middleware.cors import CORSMiddleware


from db.db import engine

from api.router.user import router as userrouter

# база данных подлкючение создание 















#Shecmy 



# создание jwt 



    

# проверка авторизации пользователя
# 




@asynccontextmanager
async def lifespan(app:FastAPI):
    Base.metadata.create_all(bind=engine)
    yield




app = FastAPI(title="Authenfication API",version="1.0.0",lifespan=lifespan)
app.include_router(router=userrouter)

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


if __name__ == "__main__":
    uvicorn.run("main:app",host="127.0.0.1",port=8000,reload=True)