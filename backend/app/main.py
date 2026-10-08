import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import (
    auth, company, tenders, dashboard,
    settings as settings_routes,
    simulation, portfolio, tasks, team, analytics
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup safely
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables initialized successfully.")
    except Exception as e:
        print(f"Warning: Database initialization during startup: {e}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="TenderIQ AI — AI-Powered Tender Intelligence, Bid Decision & Tender Operations Platform",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(company.router, prefix=settings.API_V1_STR)
app.include_router(company.companies_router, prefix=settings.API_V1_STR)
app.include_router(tenders.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(simulation.router, prefix=settings.API_V1_STR)
app.include_router(portfolio.router, prefix=settings.API_V1_STR)
app.include_router(tasks.router, prefix=settings.API_V1_STR)
app.include_router(team.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(settings_routes.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.VERSION,
        "status": "operational"
    }

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "storage": "connected",
        "database": "connected"
    }
