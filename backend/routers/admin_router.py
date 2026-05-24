from typing import List, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text

from utilities.database import get_db, engine
from models.models import (
    User, Project, SMTPLog, APILog, AIDebugLog, OTPRecord, ChatMessage,
)
from schemas.schemas import UserAdminUpdate, TableUpdateRequest
from auth.security import require_roles, hash_password

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_roles("developer"))])


@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "company_name": u.company_name,
            "is_active": u.is_active,
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


@router.put("/users/{user_id}")
def update_user(user_id: int, data: UserAdminUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.role is not None:
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.is_verified is not None:
        user.is_verified = data.is_verified
    db.commit()
    return {"message": "User updated"}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.email == "developer@costrasphere.ai":
        raise HTTPException(status_code=400, detail="Cannot delete default developer admin")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


@router.get("/projects")
def admin_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "owner_id": p.owner_id,
            "status": p.status,
            "approval_status": p.approval_status,
            "city": p.city,
            "total_budget": p.total_budget,
            "created_at": p.created_at.isoformat(),
        }
        for p in projects
    ]


@router.get("/smtp-logs")
def smtp_logs(db: Session = Depends(get_db), limit: int = 100):
    logs = db.query(SMTPLog).order_by(SMTPLog.created_at.desc()).limit(limit).all()
    return [{"id": l.id, "recipient": l.recipient, "subject": l.subject, "status": l.status, "message": l.message, "created_at": l.created_at.isoformat()} for l in logs]


@router.get("/otp-logs")
def otp_logs(db: Session = Depends(get_db), limit: int = 100):
    logs = db.query(OTPRecord).order_by(OTPRecord.created_at.desc()).limit(limit).all()
    return [{"id": l.id, "user_id": l.user_id, "otp_code": l.otp_code, "purpose": l.purpose, "is_used": l.is_used, "expires_at": l.expires_at.isoformat(), "created_at": l.created_at.isoformat()} for l in logs]


@router.get("/api-logs")
def api_logs(db: Session = Depends(get_db), limit: int = 100):
    logs = db.query(APILog).order_by(APILog.created_at.desc()).limit(limit).all()
    return [{"id": l.id, "method": l.method, "path": l.path, "status_code": l.status_code, "user_id": l.user_id, "duration_ms": l.duration_ms, "created_at": l.created_at.isoformat()} for l in logs]


@router.get("/ai-logs")
def ai_logs(db: Session = Depends(get_db), limit: int = 100):
    logs = db.query(AIDebugLog).order_by(AIDebugLog.created_at.desc()).limit(limit).all()
    return [{"id": l.id, "service": l.service, "input_data": l.input_data, "output_data": l.output_data, "message": l.message, "created_at": l.created_at.isoformat()} for l in logs]


@router.get("/tables")
def list_tables():
    inspector = inspect(engine)
    return {"tables": inspector.get_table_names()}


@router.get("/tables/{table_name}")
def get_table_data(table_name: str, db: Session = Depends(get_db), limit: int = 100):
    allowed = {"users", "projects", "otp_records", "smtp_logs", "api_logs", "ai_debug_logs", "chat_messages"}
    if table_name not in allowed:
        raise HTTPException(status_code=400, detail="Table not allowed")
    result = db.execute(text(f"SELECT * FROM {table_name} LIMIT :limit"), {"limit": limit})
    columns = result.keys()
    rows = [dict(zip(columns, row)) for row in result.fetchall()]
    for row in rows:
        for k, v in row.items():
            if hasattr(v, "isoformat"):
                row[k] = v.isoformat()
    return {"table": table_name, "columns": list(columns), "rows": rows}


@router.put("/tables/update")
def update_table_record(data: TableUpdateRequest, db: Session = Depends(get_db)):
    allowed = {"users", "projects"}
    if data.table_name not in allowed:
        raise HTTPException(status_code=400, detail="Table not editable")
    if data.table_name == "users" and "hashed_password" in data.data:
        data.data["hashed_password"] = hash_password(data.data["hashed_password"])
    set_clause = ", ".join(f"{k} = :{k}" for k in data.data.keys())
    params = {**data.data, "id": data.record_id}
    db.execute(text(f"UPDATE {data.table_name} SET {set_clause} WHERE id = :id"), params)
    db.commit()
    return {"message": "Record updated"}


@router.get("/analytics")
def admin_analytics(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_projects = db.query(Project).count()
    total_budget = db.query(Project).with_entities(Project.total_budget).all()
    budget_sum = sum(p[0] or 0 for p in total_budget)
    by_role = {}
    for role in ("customer", "company", "developer"):
        by_role[role] = db.query(User).filter(User.role == role).count()
    by_status = {}
    for status in ("draft", "planned", "active", "completed"):
        by_status[status] = db.query(Project).filter(Project.status == status).count()
    smtp_success = db.query(SMTPLog).filter(SMTPLog.status == "success").count()
    smtp_failed = db.query(SMTPLog).filter(SMTPLog.status == "failed").count()
    return {
        "total_users": total_users,
        "total_projects": total_projects,
        "total_budget": budget_sum,
        "users_by_role": by_role,
        "projects_by_status": by_status,
        "smtp_success": smtp_success,
        "smtp_failed": smtp_failed,
        "api_log_count": db.query(APILog).count(),
    }


@router.get("/diagnostics")
def diagnostics(db: Session = Depends(get_db)):
    from utilities.config import settings
    import os
    csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "global_city_costs.csv")
    return {
        "database": settings.database_url,
        "frontend_url": settings.frontend_url,
        "email_configured": bool(settings.email_user and settings.email_password),
        "csv_exists": os.path.exists(csv_path),
        "csv_size_kb": round(os.path.getsize(csv_path) / 1024, 1) if os.path.exists(csv_path) else 0,
        "tables": inspect(engine).get_table_names(),
    }
