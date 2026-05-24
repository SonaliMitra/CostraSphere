from datetime import datetime, timedelta
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    role: str = "customer"
    company_name: Optional[str] = None
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ForgotPassword(BaseModel):
    email: EmailStr


class VerifyOTP(BaseModel):
    email: EmailStr
    otp_code: str
    purpose: str = "password_reset"


class ResetPassword(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str = Field(min_length=8)


class ResendOTP(BaseModel):
    email: EmailStr
    purpose: str = "password_reset"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    company_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None


class TowerSchema(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    tower_type: str
    load_capacity: int
    connector_count: int
    fiber_node_count: int
    deployment_cost: float
    route_distance: float


class TelecomGenerateRequest(BaseModel):
    latitude: float
    longitude: float
    terrain: str = "Urban"
    currency: str = "INR"
    project_name: Optional[str] = None
    selected_company: Optional[str] = None
    max_tower_distance_km: int = 10
    city: Optional[str] = None
    state: Optional[str] = None


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    terrain: str = "Urban"
    currency: str = "INR"
    city: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    selected_company: Optional[str] = None
    max_tower_distance_km: int = 10


class RegisterComplete(BaseModel):
    email: EmailStr
    otp_code: str


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    owner_id: int
    status: str
    approval_status: str
    latitude: float
    longitude: float
    city: Optional[str]
    state: Optional[str]
    district: Optional[str]
    country: str
    terrain: str
    currency: str
    towers_data: Optional[Any]
    routes_data: Optional[Any]
    cost_breakdown: Optional[Any]
    total_budget: float
    deployment_days: int
    selected_company: Optional[str] = None
    max_tower_distance_km: int = 10
    workers_needed: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    approval_status: Optional[str] = None


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float


class CostCalculateRequest(BaseModel):
    latitude: float
    longitude: float
    terrain: str = "Urban"
    currency: str = "INR"
    route_distance_km: float = 10.0
    tower_count: int = 5


class TableUpdateRequest(BaseModel):
    table_name: str
    record_id: int
    data: dict


class UserAdminUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
