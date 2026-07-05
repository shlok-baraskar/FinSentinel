from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.database import create_tables
from app.api.routes import router
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.simulator_routes import router as simulator_router

settings = get_settings()

# ─── Create FastAPI App ───────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Real-Time Fraud Detection System"
)

# ─── CORS Middleware ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include Routes ───────────────────────────────────────────────────────────
app.include_router(router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/v1/users", tags=["users"])
app.include_router(simulator_router, prefix="/api/v1", tags=["simulator"])

# ─── Startup Event ────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    print("=" * 50)
    print(f"  {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    print("  Creating database tables...")
    create_tables()
    print("  Database tables ready!")
    print("  Server is live!")
    print("=" * 50)

# ─── Root ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "app":     settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status":  "online",
        "docs":    "/docs"
    }