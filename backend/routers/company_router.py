from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from utilities.database import get_db
from models.models import User, Project
from auth.security import require_roles

router = APIRouter(prefix="/company", tags=["Company"], dependencies=[Depends(require_roles("company", "developer"))])


@router.get("/analytics")
def company_analytics(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    total_revenue = sum(p.total_budget or 0 for p in projects)
    approved = sum(1 for p in projects if p.approval_status == "approved")
    pending = sum(1 for p in projects if p.approval_status == "pending")
    workers = db.query(User).filter(User.role == "customer").count()
    by_city = {}
    for p in projects:
        key = p.city or "Unknown"
        by_city[key] = by_city.get(key, 0) + 1
    avg_budget = total_revenue / max(len(projects), 1)
    avg_days = sum(p.deployment_days or 0 for p in projects) / max(len(projects), 1)
    return {
        "total_projects": len(projects),
        "total_revenue": total_revenue,
        "approved_projects": approved,
        "pending_approvals": pending,
        "active_workers": workers,
        "projects_by_city": by_city,
        "average_budget": round(avg_budget, 2),
        "average_deployment_days": round(avg_days, 1),
        "monthly_revenue": [
            {"month": f"Month {i}", "revenue": round(total_revenue / 12 * (0.7 + 0.3 * (i / 12)), 2)}
            for i in range(1, 13)
        ],
    }


@router.get("/workers")
def worker_analytics(db: Session = Depends(get_db)):
    customers = db.query(User).filter(User.role == "customer").all()
    result = []
    for c in customers:
        proj_count = db.query(Project).filter(Project.owner_id == c.id).count()
        total_spend = db.query(func.sum(Project.total_budget)).filter(Project.owner_id == c.id).scalar() or 0
        result.append({
            "id": c.id,
            "name": c.full_name,
            "email": c.email,
            "projects": proj_count,
            "total_spend": total_spend,
            "company": c.company_name,
        })
    return result


@router.get("/projects/pending")
def pending_approvals(db: Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.approval_status == "pending").all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "owner_id": p.owner_id,
            "city": p.city,
            "state": p.state,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "currency": p.currency,
            "total_budget": p.total_budget,
            "terrain": p.terrain,
            "selected_company": p.selected_company,
            "max_tower_distance_km": p.max_tower_distance_km,
            "cost_breakdown": p.cost_breakdown,
            "deployment_days": p.deployment_days,
            "workers_needed": p.workers_needed,
            "created_at": p.created_at.isoformat(),
        }
        for p in projects
    ]


@router.get("/projects/all")
def all_company_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "city": p.city,
            "approval_status": p.approval_status,
            "total_budget": p.total_budget,
            "deployment_days": p.deployment_days,
            "workers_needed": p.workers_needed,
            "selected_company": p.selected_company,
            "max_tower_distance_km": p.max_tower_distance_km,
            "cost_breakdown": p.cost_breakdown,
            "towers_data": p.towers_data,
            "routes_data": p.routes_data,
            "latitude": p.latitude,
            "longitude": p.longitude,
        }
        for p in projects
    ]
