from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import llm_routes, streamlit_routes, database_routes

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API server for AI Studio - LLM API proxy",
    version="1.0.0",
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(llm_routes.router)
app.include_router(streamlit_routes.router)
app.include_router(database_routes.router)


@app.get("/")
async def root():
    """
    Root endpoint
    """
    return {
        "message": "AI Studio Backend API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/llm/health"
    }


@app.get("/health")
async def health():
    """
    General health check
    """
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
