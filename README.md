# CostraSphere AI

Production-ready AI SaaS platform for telecom infrastructure planning, cost analytics, and deployment management.

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS, Framer Motion, React Leaflet, Recharts
- **Backend:** FastAPI, SQLAlchemy, SQLite, JWT, Pandas, Geopy, Haversine, ReportLab
- **Deployment:** Vercel (frontend), Railway (backend)

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

API runs at `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

## Default Developer Admin

- **Email:** developer@costrasphere.ai
- **Password:** CostraSphere@Dev2026

## Roles

| Role | Dashboard |
|------|-----------|
| customer | Telecom map, AI budget, projects, chatbot, PDF reports |
| company | Worker analytics, approvals, revenue, map analytics |
| developer | Super admin: DB viewer, logs, user management |

## Environment Variables

### Backend (`backend/.env`)

```
EMAIL_USER=costrasphere@gmail.com
EMAIL_PASSWORD=your-app-password
JWT_SECRET=CostraSphereJWTSecret2026
DATABASE_URL=sqlite:///./costrasphere.db
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```
VITE_API_BASE_URL=http://localhost:8000
```

## Deployment

### Railway (Backend)

Set environment variables in Railway dashboard. Start command:

```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Vercel (Frontend)

Set `VITE_API_BASE_URL` to your Railway URL. Deploy from `frontend/` directory.

## Features

- JWT authentication with Gmail SMTP OTP password reset
- Real OSRM road-based fiber routing
- Nominatim reverse geocoding with state/city validation
- Tower generation with terrain-based density
- Cost engine powered by `global_city_costs.csv`
- Downloadable PDF deployment reports
- Role-based dashboards

## Docker

```bash
docker-compose up --build
```
