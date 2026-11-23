



class Settings:
    db_url:str
  
    connect_args:dict
def get_settings():
    return Settings(db_url="sqlite:///./users.db",connect_args={"check_same_thread":False})