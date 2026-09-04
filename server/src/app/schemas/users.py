from pydantic import BaseModel, EmailStr, Field


class UserSignup(BaseModel):
    email: EmailStr = Field(max_length=120)
    full_name: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=8, max_length=50)

    class Config:
        json_schema_extra = {
            "example": {
                "email": "johndoe@gmail.com",
                "full_name": "John Doe",
                "password": "verystrongpassword",
            }
        }


class UserSignupData(BaseModel):
    email: EmailStr


class UserLogin(BaseModel):
    email: EmailStr = Field(max_length=120)
    password: str = Field(min_length=8, max_length=50)

    class Config:
        json_schema_extra = {
            "example": {
                "email": "johndoe@gmail.com",
                "password": "verystrongpassword",
            }
        }


# class BaseResponse(BaseModel):
#     message: str = "Request processed successfully"

# # 2. Inherit and add route-specific fields
# class UserSignupResp(BaseResponse):
#     message: str = "User account created successfully"  # optional default override
#     email: EmailStr
