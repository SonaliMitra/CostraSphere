import random
import string
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from utilities.database import get_db
from models.models import User, OTPRecord
from schemas.schemas import (
    UserRegister, UserLogin, ForgotPassword, VerifyOTP,
    ResetPassword, ResendOTP, TokenResponse, UserResponse, UserUpdate, RegisterComplete,
)
from auth.security import hash_password, verify_password, create_access_token, get_current_user
from services.email_service import send_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _create_otp(db: Session, user: User, purpose: str) -> str:
    from utilities.config import settings
    db.query(OTPRecord).filter(
        OTPRecord.user_id == user.id,
        OTPRecord.purpose == purpose,
        OTPRecord.is_used == False,
    ).update({"is_used": True})
    code = _generate_otp()
    otp = OTPRecord(
        user_id=user.id,
        otp_code=code,
        purpose=purpose,
        expires_at=datetime.utcnow() + timedelta(minutes=settings.otp_expire_minutes),
    )
    db.add(otp)
    db.commit()
    return code


def _verify_otp_record(db: Session, user: User, otp_code: str, purpose: str, mark_used: bool = True) -> OTPRecord:
    otp = (
        db.query(OTPRecord)
        .filter(
            OTPRecord.user_id == user.id,
            OTPRecord.otp_code == otp_code,
            OTPRecord.purpose == purpose,
            OTPRecord.is_used == False,
        )
        .order_by(OTPRecord.created_at.desc())
        .first()
    )
    if not otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")
    if mark_used:
        otp.is_used = True
    return otp


@router.post("/register")
def register(data: UserRegister, db: Session = Depends(get_db)):
    if data.role not in ("customer", "company", "developer"):
        raise HTTPException(status_code=400, detail="Invalid role")
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=400, detail="Email already registered")
        db.delete(existing)
        db.commit()

    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role=data.role,
        company_name=data.company_name if data.role == "company" else None,
        phone=data.phone,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    code = _create_otp(db, user, "registration")
    sent = send_otp_email(db, user.email, code, "registration")
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP email. Check SMTP settings.")

    return {
        "message": "Registration initiated. Please verify OTP sent to your email.",
        "email": user.email,
        "requires_otp": True,
    }


@router.post("/complete-registration", response_model=TokenResponse)
def complete_registration(data: RegisterComplete, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Account already verified")

    _verify_otp_record(db, user, data.otp_code, "registration")
    user.is_verified = True
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user=_user_dict(user))


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified. Please complete OTP verification.")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return TokenResponse(access_token=token, user=_user_dict(user))


@router.post("/logout")
def logout(user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully. Please discard the token on client side."}


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserResponse)
def update_me(data: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.company_name is not None:
        user.company_name = data.company_name
    if data.phone is not None:
        user.phone = data.phone
    db.commit()
    db.refresh(user)
    return user


@router.get("/companies")
def list_companies(db: Session = Depends(get_db)):
    rows = (
        db.query(User.id, User.company_name, User.full_name, User.email)
        .filter(User.role == "company", User.company_name.isnot(None), User.company_name != "", User.is_verified == True)
        .order_by(User.company_name)
        .all()
    )
    return [
        {"id": r.id, "company_name": r.company_name, "admin_name": r.full_name, "email": r.email}
        for r in rows
    ]


@router.post("/forgot-password")
def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"message": "If the email exists, an OTP has been sent."}
    code = _create_otp(db, user, "password_reset")
    sent = send_otp_email(db, user.email, code, "password_reset")
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")
    return {"message": "OTP sent to your email."}


@router.post("/verify-otp")
def verify_otp(data: VerifyOTP, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    _verify_otp_record(db, user, data.otp_code, data.purpose, mark_used=False)
    db.commit()
    return {"message": "OTP verified successfully", "valid": True}


@router.post("/resend-otp")
def resend_otp(data: ResendOTP, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"message": "If the email exists, an OTP has been sent."}
    code = _create_otp(db, user, data.purpose)
    sent = send_otp_email(db, user.email, code, data.purpose)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")
    return {"message": "OTP resent successfully."}


@router.post("/reset-password")
def reset_password(data: ResetPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    _verify_otp_record(db, user, data.otp_code, "password_reset")
    user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password reset successfully."}


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "company_name": user.company_name,
        "phone": user.phone,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
    }
