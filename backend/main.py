import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from utilities.database import engine, Base, SessionLocal
from utilities.config import settings
from models.models import User
from auth.security import hash_password
from middleware.logging_middleware import APILoggingMiddleware
from routers.auth_router import router as auth_router
from routers.telecom_router import router as telecom_router
from routers.projects_router import router as projects_router
from routers.admin_router import router as admin_router
from routers.company_router import router as company_router


def seed_developer_admin():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "developer@costrasphere.ai").first()
        if not admin:
            admin = User(
                email="developer@costrasphere.ai",
                full_name="CostraSphere Developer Admin",
                hashed_password=hash_password("CostraSphere@Dev2026"),
                role="developer",
                is_active=True,
                is_verified=True,
            )
            db.add(admin)
            db.commit()
        else:
            admin.hashed_password = hash_password("CostraSphere@Dev2026")
            admin.is_verified = True
            db.commit()
    finally:
        db.close()


def migrate_db():
    from sqlalchemy import text, inspect
    cols = {c["name"] for c in inspect(engine).get_columns("projects")} if "projects" in inspect(engine).get_table_names() else set()
    alters = []
    if "selected_company" not in cols:
        alters.append("ALTER TABLE projects ADD COLUMN selected_company VARCHAR(255)")
    if "max_tower_distance_km" not in cols:
        alters.append("ALTER TABLE projects ADD COLUMN max_tower_distance_km INTEGER DEFAULT 10")
    if "workers_needed" not in cols:
        alters.append("ALTER TABLE projects ADD COLUMN workers_needed INTEGER DEFAULT 0")
    if alters:
        with engine.connect() as conn:
            for sql in alters:
                conn.execute(text(sql))
            conn.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    migrate_db()
    seed_developer_admin()
    yield


app = FastAPI(
    title="CostraSphere AI API",
    description="Production-ready Telecom AI SaaS Platform",
    version="1.0.0",
    lifespan=lifespan,
)

origins = list({
    settings.frontend_url,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    os.getenv("FRONTEND_URL", ""),
})

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in origins if o],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)
app.add_middleware(APILoggingMiddleware)

app.include_router(auth_router)
app.include_router(telecom_router)
app.include_router(projects_router)
app.include_router(admin_router)
app.include_router(company_router)


@app.get("/")
def root():
    return {"message": "CostraSphere AI API", "status": "running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
