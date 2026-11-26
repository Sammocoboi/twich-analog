from pydantic import BaseModel,EmailStr,Field,ConfigDict


class UserCreate(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    email:EmailStr
    password:str = Field(
        min_length=8,
        max_length=128
    )

class UserLogin(UserCreate):
    id:int
    pass

class UserSchema(BaseModel):
    id:int
    email:EmailStr
    model_config=ConfigDict(from_attributes=True)
