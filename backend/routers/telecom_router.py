from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import os

from utilities.database import get_db
from models.models import User, Project
from schemas.schemas import (
    TelecomGenerateRequest, RouteRequest, CostCalculateRequest, ChatRequest, ChatResponse,
)
from auth.security import get_current_user, require_roles
from services.telecom_service import (
    match_location, generate_towers, calculate_costs, generate_routes, get_osrm_route,
)
from services.chatbot_service import generate_chatbot_reply
from services.pdf_service import generate_project_pdf

router = APIRouter(prefix="/telecom", tags=["Telecom AI"])


@router.post("/generate")
async def generate_telecom_plan(
    data: TelecomGenerateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Validate latitude and longitude
    if data.latitude < -90 or data.latitude > 90:
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
    if data.longitude < -180 or data.longitude > 180:
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")
    
    # Validate that company is selected
    if not getattr(data, "selected_company", None):
        raise HTTPException(status_code=400, detail="Company selection is required")
    
    # Verify that the selected company exists
    company = db.query(User).filter(
        (User.company_name == data.selected_company) & 
        (User.role == "company")
    ).first()
    if not company:
        raise HTTPException(status_code=400, detail="Selected company not found or not registered")
    
    location = match_location(data.latitude, data.longitude, db)
    # allow manual override of city/state if provided by user
    if getattr(data, "city", None):
        location["city"] = data.city
    if getattr(data, "state", None):
        location["state"] = data.state
    max_dist = getattr(data, "max_tower_distance_km", 10) or 10
    # Use currency from location (auto-detected), terrain defaults to Urban
    terrain = data.terrain or "Urban"
    currency = location.get("currency", "INR")
    
    towers = generate_towers(data.latitude, data.longitude, location, terrain, currency, max_dist, db)
    routes = await generate_routes(data.latitude, data.longitude, towers)
    total_route_km = sum(r["distance_km"] for r in routes) if routes else sum(t["route_distance"] for t in towers)
    costs = calculate_costs(location, towers, terrain, currency, total_route_km, include_profit=True)

    project = Project(
        name=data.project_name or f"{location['city']} Deployment",
        owner_id=user.id,
        latitude=data.latitude,
        longitude=data.longitude,
        city=location["city"],
        state=location["state"],
        district=location.get("district"),
        country=location.get("country", "INDIA"),
        terrain=terrain,
        currency=currency,
        selected_company=data.selected_company,
        max_tower_distance_km=max_dist,
        towers_data=towers,
        routes_data=routes,
        cost_breakdown=costs,
        total_budget=costs["final_budget"],
        deployment_days=costs["deployment_duration_days"],
        workers_needed=costs.get("workers_needed", 0),
        status="planned",
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return {
        "project_id": project.id,
        "location": location,
        "towers": towers,
        "routes": routes,
        "costs": costs,
        "hub": {"latitude": data.latitude, "longitude": data.longitude},
    }


@router.post("/route")
async def get_route(data: RouteRequest, user: User = Depends(get_current_user)):
    try:
        route = await get_osrm_route(data.start_lat, data.start_lng, data.end_lat, data.end_lng)
        return route
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Routing failed: {exc}") from exc


@router.post("/location")
def get_location(latitude: float, longitude: float, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return match_location(latitude, longitude, db)


@router.post("/cost")
def calculate_cost(
    data: CostCalculateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    location = match_location(data.latitude, data.longitude, db)
    towers = generate_towers(data.latitude, data.longitude, location, data.terrain, data.currency, db)
    if data.tower_count and data.tower_count < len(towers):
        towers = towers[:data.tower_count]
    costs = calculate_costs(location, towers, data.terrain, data.currency, data.route_distance_km)
    return {"location": location, "towers": towers, "costs": costs}


@router.post("/chat", response_model=ChatResponse)
def chat(
    data: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    latest = (
        db.query(Project)
        .filter(Project.owner_id == user.id)
        .order_by(Project.created_at.desc())
        .first()
    )
    context = {}
    if latest:
        context = {
            "total_budget": latest.total_budget,
            "currency": latest.currency,
            "city": latest.city,
            "state": latest.state,
            "towers": latest.towers_data or [],
            "routes": latest.routes_data or [],
        }
    reply = generate_chatbot_reply(data.message, context)
    from models.models import ChatMessage
    db.add(ChatMessage(user_id=user.id, role="user", content=data.message))
    db.add(ChatMessage(user_id=user.id, role="assistant", content=reply))
    db.commit()
    return ChatResponse(reply=reply)


@router.get("/projects/{project_id}/report")
def download_report(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != user.id and user.role not in ("company", "developer"):
        raise HTTPException(status_code=403, detail="Access denied")

    owner = db.query(User).filter(User.id == project.owner_id).first()
    logo_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "frontend", "src", "assets", "images", "logo.png")
    logo_path = os.path.normpath(logo_path)

    pdf_bytes = generate_project_pdf(
        {
            "name": project.name,
            "city": project.city,
            "state": project.state,
            "terrain": project.terrain,
            "status": project.status,
            "currency": project.currency,
            "total_budget": project.total_budget,
            "deployment_days": project.deployment_days,
            "cost_breakdown": project.cost_breakdown,
            "towers_data": project.towers_data,
            "routes_data": project.routes_data,
        },
        {"full_name": owner.full_name, "email": owner.email, "company_name": owner.company_name},
        logo_path if os.path.exists(logo_path) else None,
    )
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=costrasphere_report_{project_id}.pdf"},
    )


@router.delete("/projects/{project_id}/report")
def delete_report(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # allow owner to delete their report, or company/developer to remove if necessary
    if user.role == "customer" and project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(project)
    db.commit()
    return {"message": "Report/project deleted"}

@router.post("/projects/{project_id}/send-approval")
def send_approval_request(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """CORRECTION #9: Customer sends approval request to company."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get company details
    company = db.query(User).filter(
        (User.company_name == project.selected_company) & 
        (User.role == "company")
    ).first()
    if not company:
        raise HTTPException(status_code=400, detail="Company not found")
    
    # Generate approval link (company dashboard login)
    approval_link = f"{settings.frontend_url}/login?redirect=/company/approvals"
    
    # Send email to company
    from services.email_service import send_approval_request_email
    send_approval_request_email(
        db,
        company.email,
        user.full_name,
        company.company_name,
        project.name,
        approval_link
    )
    
    return {"message": f"Approval request sent to {company.company_name}"}


@router.put("/projects/{project_id}/approve")
def approve_project(
    project_id: int,
    status: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """CORRECTION #11: Company approves/rejects and sends email to customer."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Verify company is approving
    if user.role != "company" or user.company_name != project.selected_company:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if status not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    # Update project status
    project.approval_status = status
    db.commit()
    
    # Get customer details
    customer = db.query(User).filter(User.id == project.owner_id).first()
    
    # Send email to customer
    from services.email_service import send_approval_response_email
    send_approval_response_email(
        db,
        customer.email,
        customer.full_name,
        user.company_name,
        project.name,
        status
    )
    
    return {"message": f"Project {status}", "project_id": project.id}