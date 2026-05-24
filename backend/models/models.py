from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship

from utilities.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="customer", nullable=False)
    company_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    projects = relationship("Project", back_populates="owner", foreign_keys="Project.owner_id")
    otps = relationship("OTPRecord", back_populates="user")


class OTPRecord(Base):
    __tablename__ = "otp_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    otp_code = Column(String(10), nullable=False)
    purpose = Column(String(50), nullable=False)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="otps")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="draft")
    approval_status = Column(String(50), default="pending")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    city = Column(String(255), nullable=True)
    state = Column(String(255), nullable=True)
    district = Column(String(255), nullable=True)
    country = Column(String(255), default="INDIA")
    terrain = Column(String(50), default="Urban")
    currency = Column(String(10), default="INR")
    towers_data = Column(JSON, nullable=True)
    routes_data = Column(JSON, nullable=True)
    cost_breakdown = Column(JSON, nullable=True)
    total_budget = Column(Float, default=0)
    deployment_days = Column(Integer, default=0)
    selected_company = Column(String(255), nullable=True)
    max_tower_distance_km = Column(Integer, default=10)
    workers_needed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="projects", foreign_keys=[owner_id])


class SMTPLog(Base):
    __tablename__ = "smtp_logs"

    id = Column(Integer, primary_key=True, index=True)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    status = Column(String(50), nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class APILog(Base):
    __tablename__ = "api_logs"

    id = Column(Integer, primary_key=True, index=True)
    method = Column(String(10), nullable=False)
    path = Column(String(500), nullable=False)
    status_code = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=True)
    duration_ms = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AIDebugLog(Base):
    __tablename__ = "ai_debug_logs"

    id = Column(Integer, primary_key=True, index=True)
    service = Column(String(100), nullable=False)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
