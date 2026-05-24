from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from utilities.database import get_db
from models.models import User, Project
from schemas.schemas import ProjectCreate, ProjectResponse, ProjectUpdate
from auth.security import get_current_user
from services.telecom_service import match_location, generate_towers, calculate_costs, generate_routes, calculate_workers_needed

router = APIRouter(prefix="/projects", tags=["Projects"])


def _build_project(db: Session, user: User, data, location, towers, routes, costs):
    total_route_km = sum(r["distance_km"] for r in routes) if routes else sum(t["route_distance"] for t in towers)
    costs = costs or calculate_costs(location, towers, data.terrain, data.currency, total_route_km)
    return Project(
        name=data.name,
        description=getattr(data, "description", None),
        owner_id=user.id,
        latitude=data.latitude,
        longitude=data.longitude,
        city=getattr(data, "city", None) or location["city"],
        state=getattr(data, "state", None) or location["state"],
        district=getattr(data, "district", None) or location.get("district"),
        terrain=data.terrain,
        currency=data.currency,
        selected_company=getattr(data, "selected_company", None),
        max_tower_distance_km=getattr(data, "max_tower_distance_km", 10) or 10,
        towers_data=towers,
        routes_data=routes,
        cost_breakdown=costs,
        total_budget=costs["final_budget"],
        deployment_days=costs["deployment_duration_days"],
        workers_needed=costs.get("workers_needed", 0),
        status="planned",
    )


@router.get("/", response_model=List[ProjectResponse])
def list_projects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "developer":
        return db.query(Project).order_by(Project.created_at.desc()).all()
    if user.role == "company":
        return db.query(Project).filter(
            (Project.selected_company == user.company_name) | (Project.selected_company.is_(None))
        ).order_by(Project.created_at.desc()).all()
    return db.query(Project).filter(Project.owner_id == user.id).order_by(Project.created_at.desc()).all()


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if user.role == "customer" and project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return project


@router.post("/", response_model=ProjectResponse)
async def create_project(data: ProjectCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    location = match_location(data.latitude, data.longitude, db)
    towers = generate_towers(data.latitude, data.longitude, location, data.terrain, data.currency, data.max_tower_distance_km, db)
    routes = await generate_routes(data.latitude, data.longitude, towers)
    total_route_km = sum(r["distance_km"] for r in routes) if routes else sum(t["route_distance"] for t in towers)
    costs = calculate_costs(location, towers, data.terrain, data.currency, total_route_km)

    project = _build_project(db, user, data, location, towers, routes, costs)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, data: ProjectUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if user.role == "customer" and project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.status is not None:
        project.status = data.status

    if data.approval_status is not None and user.role in ("company", "developer"):
        project.approval_status = data.approval_status
        if data.approval_status == "approved":
            towers = project.towers_data or []
            route_km = (project.cost_breakdown or {}).get("total_route_km", 0)
            project.workers_needed = calculate_workers_needed(towers, route_km, project.deployment_days)
            if project.cost_breakdown:
                breakdown = dict(project.cost_breakdown)
                profit = breakdown.get("subtotal_cost", project.total_budget) * 0.10
                breakdown["company_profit"] = round(profit, 2)
                breakdown["profit_margin_percent"] = 10.0
                project.cost_breakdown = breakdown
            project.status = "approved"

    db.commit()
    db.refresh(project)
    return project


@router.post("/{project_id}/send_proposal", response_model=ProjectResponse)
def send_proposal(project_id: int, route_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Customer confirms a single route to send as a proposal to the selected company.
    This will reduce the project's routes to the selected route and recalc costs WITHOUT company profit.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if not project.selected_company:
        raise HTTPException(status_code=400, detail="No company selected for this project")

    routes = project.routes_data or []
    towers = project.towers_data or []
    selected_route = next((r for r in routes if r.get("tower_id") == route_id), None)
    if not selected_route:
        raise HTTPException(status_code=400, detail="Selected route not found in project")

    # find corresponding tower for more accurate cost estimate (single-tower)
    tower = next((t for t in towers if t.get("id") == route_id), None)
    towers_for_calc = [t for t in towers if t.get("tower_type") == "Central Office"]
    if tower:
        towers_for_calc.append(tower)

    # use location from project
    location = {
        "city": project.city,
        "state": project.state,
        "terrain_multiplier_csv": project.cost_breakdown.get("terrain_multiplier") if project.cost_breakdown else 1.0,
        "fiber_per_km": project.cost_breakdown.get("fiber_deployment_cost", 0) / max(1, project.cost_breakdown.get("total_route_km", 1)),
        "labor_per_km": project.cost_breakdown.get("labor_planning_cost", 0) / max(1, project.cost_breakdown.get("total_route_km", 1)),
        "connector_cost": project.cost_breakdown.get("connector_cost", 0) / max(1, sum(t.get("connector_count", 1) for t in towers_for_calc)),
        "maintenance_per_km": project.cost_breakdown.get("maintenance_cost", 0) / max(1, project.cost_breakdown.get("total_route_km", 1)),
        "estimated_total_project_cost": project.total_budget,
        "currency": project.currency,
        "currency_symbol": (project.cost_breakdown or {}).get("currency_symbol") if project.cost_breakdown else project.currency,
    }

    # Recalculate costs for this single route WITHOUT profit
    from services.telecom_service import calculate_costs as _calc
    costs = _calc(location, towers_for_calc, project.terrain or "Urban", project.currency or "INR", selected_route.get("distance_km", 0), include_profit=False)

    # Update project to contain a single route (proposal) so company sees only this
    project.routes_data = [selected_route]
    project.towers_data = towers_for_calc
    project.cost_breakdown = costs
    project.total_budget = costs.get("final_budget", project.total_budget)
    project.status = "proposal_sent"
    project.approval_status = "pending"

    db.commit()
    db.refresh(project)

    # Notify selected company by email (if available)
    try:
        company_user = db.query(User).filter((User.company_name == project.selected_company) & (User.role == "company")).first()
        if company_user and company_user.email:
            from services.email_service import send_email
            subject = f"New Proposal: {project.name} from {user.full_name}"
            html = f"<p>Dear {company_user.full_name or company_user.company_name},</p>"
            html += f"<p>A customer has sent a proposal for project <strong>{project.name}</strong> in {project.city}, {project.state}.</p>"
            html += f"<p>Selected route: <strong>{selected_route.get('tower_name')}</strong> — {selected_route.get('distance_km')} km</p>"
            html += f"<p>Estimated customer total (excl. company profit): <strong>{project.currency} {costs.get('final_budget', 0):,.2f}</strong></p>"
            html += "<p>Please login to your CostraSphere account to review and respond to the proposal.</p>"
            send_email(db, company_user.email, subject, html)
    except Exception:
        pass

    return project


@router.post("/{project_id}/preview_proposal")
def preview_proposal(project_id: int, route_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return cost breakdown for a single route without persisting."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    routes = project.routes_data or []
    towers = project.towers_data or []
    selected_route = next((r for r in routes if r.get("tower_id") == route_id), None)
    if not selected_route:
        raise HTTPException(status_code=400, detail="Selected route not found in project")

    tower = next((t for t in towers if t.get("id") == route_id), None)
    towers_for_calc = [t for t in towers if t.get("tower_type") == "Central Office"]
    if tower:
        towers_for_calc.append(tower)

    location = {
        "city": project.city,
        "state": project.state,
        "terrain_multiplier_csv": project.cost_breakdown.get("terrain_multiplier") if project.cost_breakdown else 1.0,
        "fiber_per_km": project.cost_breakdown.get("fiber_deployment_cost", 0) / max(1, project.cost_breakdown.get("total_route_km", 1)),
        "labor_per_km": project.cost_breakdown.get("labor_planning_cost", 0) / max(1, project.cost_breakdown.get("total_route_km", 1)),
        "connector_cost": project.cost_breakdown.get("connector_cost", 0) / max(1, sum(t.get("connector_count", 1) for t in towers_for_calc)),
        "maintenance_per_km": project.cost_breakdown.get("maintenance_cost", 0) / max(1, project.cost_breakdown.get("total_route_km", 1)),
        "estimated_total_project_cost": project.total_budget,
        "currency": project.currency,
    }

    from services.telecom_service import calculate_costs as _calc
    costs = _calc(location, towers_for_calc, project.terrain or "Urban", project.currency or "INR", selected_route.get("distance_km", 0), include_profit=False)
    return {"costs": costs, "route": selected_route}


@router.delete("/{project_id}")
def delete_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if user.role == "customer" and project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted"}
