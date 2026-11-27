import os
from dotenv import load_dotenv

from dataclasses import dataclass
load_dotenv()
SECRET_KEY = os.environ['JWT_SECRET_KEY']
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 
@dataclass
class Settings:
    db_url:str
    secret_key:str
    algorithm:str

    acess_token_expire_minutes:int
  
    connect_args:dict   
def get_settings():
    return Settings(db_url="sqlite:///./users.db",connect_args={"check_same_thread":False},secret_key=SECRET_KEY,algorithm=ALGORITHM,acess_token_expire_minutes=ACCESS_TOKEN_EXPIRE_MINUTES)