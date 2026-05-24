import io
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image


def generate_project_pdf(
    project: Dict[str, Any],
    user: Dict[str, Any],
    logo_path: Optional[str] = None,
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=60, bottomMargin=50)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Heading1"], textColor=colors.HexColor("#7c3aed"), fontSize=22, spaceAfter=6)
    heading = ParagraphStyle("Heading", parent=styles["Heading2"], textColor=colors.HexColor("#6d28d9"), fontSize=14, spaceBefore=12, spaceAfter=8)
    subheading = ParagraphStyle("Subheading", parent=styles["Heading3"], textColor=colors.HexColor("#7c3aed"), fontSize=11, spaceBefore=6, spaceAfter=4)
    normal = styles["Normal"]
    footer_style = ParagraphStyle("Footer", parent=styles["Normal"], fontSize=10, textColor=colors.HexColor("#7c3aed"), alignment=1)
    elements = []

    # Add team logo if available
    if logo_path and os.path.exists(logo_path):
        try:
            elements.append(Image(logo_path, width=1.8 * inch, height=0.7 * inch))
            elements.append(Spacer(1, 6))
        except Exception:
            pass

    elements.append(Paragraph("CostraSphere AI - Professional Deployment Report", title_style))
    elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %I:%M %p UTC')}", subheading))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("Customer Information", heading))
    customer_data = [
        ["Full Name", user.get("full_name", "N/A")],
        ["Email Address", user.get("email", "N/A")],
        ["Organization", user.get("company_name") or "Individual"],
    ]
    elements.append(_make_table(customer_data, col_widths=[150, 300]))
    elements.append(Spacer(1, 16))

    elements.append(Paragraph("Deployment Summary", heading))
    summary = [
        ["Project Name", project.get("name", "N/A")],
        ["Location", f"{project.get('city', '')}, {project.get('state', '')}"],
        ["Terrain Type", project.get("terrain", "Urban")],
        ["Project Status", project.get("status", "draft").title()],
        ["Total Budget", f"{project.get('currency', 'INR')} {project.get('total_budget', 0):,.2f}"],
        ["Estimated Duration", f"{project.get('deployment_days', 0)} days"],
    ]
    elements.append(_make_table(summary, col_widths=[150, 300]))
    elements.append(Spacer(1, 16))

    cost = project.get("cost_breakdown") or {}
    if cost:
        elements.append(Paragraph("Financial Breakdown", heading))
        company_profit = cost.get('company_profit', 0) or 0
        displayed_final = (cost.get('final_budget', 0) - company_profit) if cost.get('final_budget') is not None else 0
        cur = project.get('currency', '') or ''
        cost_rows = [
            ["Fiber Deployment Cost", f"{cur} {cost.get('fiber_deployment_cost', 0):,.2f}"],
            ["Tower Installation Cost", f"{cur} {cost.get('tower_installation_cost', 0):,.2f}"],
            ["Maintenance Cost", f"{cur} {cost.get('maintenance_cost', 0):,.2f}"],
            ["Transport & Logistics", f"{cur} {cost.get('transport_cost', 0):,.2f}"],
            ["Labor & Planning", f"{cur} {cost.get('labor_planning_cost', 0):,.2f}"],
            ["Connector Infrastructure", f"{cur} {cost.get('connector_cost', 0):,.2f}"],
            ["Terrain Multiplier", f"{cost.get('terrain_multiplier', 1.0)}x"],
            ["Customer Total (Base Cost)", f"{cur} {displayed_final:,.2f}"],
            ["Company Profit (10%)", f"{cur} {company_profit:,.2f}"],
            ["Final Total Amount", f"{cur} {cost.get('final_budget', 0):,.2f}"],
        ]
        elements.append(_make_table(cost_rows, col_widths=[200, 250]))
        elements.append(Spacer(1, 16))

    towers: List[Dict] = project.get("towers_data") or []
    if towers:
        elements.append(Paragraph(f"Telecom Infrastructure ({len(towers)} Locations)", heading))
        tower_rows = [["Tower ID", "Name", "Type", "Connectors", "Nodes", "Cost", "Distance"]]
        total_cost = 0
        for t in towers[:20]:
            t_cost = t.get('deployment_cost', 0)
            total_cost += t_cost
            tower_rows.append([
                t.get("id", "")[:6],
                t.get("name", "")[:20],
                t.get("tower_type", "")[:12],
                str(t.get("connector_count", 0)),
                str(t.get("fiber_node_count", 0)),
                f"{t_cost:,.0f}",
                f"{t.get('route_distance', 0):.1f} km",
            ])
        tower_rows.append(["TOTAL", "", "", "", "", f"{total_cost:,.0f}", ""])
        elements.append(_make_table(tower_rows, col_widths=[60, 100, 80, 60, 50, 70, 70]))
        elements.append(Spacer(1, 16))

    routes = project.get("routes_data") or []
    if routes:
        elements.append(Paragraph(f"Fiber Route Analytics ({len(routes)} Routes)", heading))
        route_rows = [["Tower Connection", "Distance (km)", "Duration (min)", "Route Cost"]]
        total_dist = 0
        total_route_cost = 0
        for r in routes:
            dist = r.get("distance_km", 0)
            route_cost = r.get("route_cost", 0)
            total_dist += dist
            total_route_cost += route_cost
            route_rows.append([
                r.get("tower_name", "")[:30],
                f"{dist:.2f}",
                str(r.get("duration_min", 0)),
                f"{route_cost:,.0f}"
            ])
        route_rows.append(["TOTAL ROUTE", f"{total_dist:.2f}", "", f"{total_route_cost:,.0f}"])
        elements.append(_make_table(route_rows, col_widths=[200, 100, 100, 100]))
        elements.append(Spacer(1, 16))

    elements.append(Paragraph("Deployment Timeline & Schedule", heading))
    days = project.get("deployment_days", 30)
    timeline = [
        ["Phase", "Duration", "Key Activities"],
        ["Site Survey & Planning", f"{max(1, days // 10)} days", "Location verification, site assessment"],
        ["Tower Installation", f"{max(3, days // 3)} days", "Structural setup, foundation work"],
        ["Fiber Route Deployment", f"{max(5, days // 2)} days", "Cable laying, network setup"],
        ["Testing & Commissioning", f"{max(2, days // 5)} days", "System tests, quality assurance"],
    ]
    elements.append(_make_table(timeline, col_widths=[150, 100, 250]))
    elements.append(Spacer(1, 24))

    # Team signature section
    elements.append(Paragraph("_" * 80, normal))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph("With Regards,<br/><b>Team Digital Dynamos 💜</b>", footer_style))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph("CostraSphere AI - Intelligent Telecom Deployment Solutions", footer_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


def _make_table(rows: List[List], col_widths: Optional[List] = None) -> Table:
    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ede9fe")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#5b21b6")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#c4b5fd")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#faf5ff")]),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    return t
