"""
BESS Battery Management System API
==================================
FastAPI application for optimized real-time BESS data access.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import bess, ai_analysis
from core.config import *

app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=CORS_METHODS,
    allow_headers=CORS_HEADERS,
)

# Mount static files
# app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(bess.router, prefix="/bess", tags=["BESS - Unified Energy Storage"])
app.include_router(ai_analysis.router, prefix="/ai", tags=["AI Analysis"])

@app.get("/")
def get_api_info():
    """Get API information and available endpoints"""
    return {
        "name": "BESS Battery Energy Storage System API",
        "version": "1.0.0",
        "description": "Unified optimized BESS data access with core metrics",
        "systems": {
            "BESS": "Battery Energy Storage System - unified BMS + PCS + Environmental data"
        },
        "endpoints": {
            "devices": "/bess/devices",
            "data": "/bess/{device_id}",
            "stream": "/bess/{device_id}/stream",
            "ai_analysis": "/ai/analyze",
            "ai_prompts": "/ai/prompts",
            "device_analysis": "/ai/device-analysis/{device_id}"
        },
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc"
        },
        "example_urls": {
            "devices": "http://localhost:8002/bess/devices",
            "data": "http://localhost:8002/bess/ZHPESS232A230002?batch_size=100",
            "stream": "http://localhost:8002/bess/ZHPESS232A230002/stream?interval=2.0",
            "ai_prompts": "http://localhost:8002/ai/prompts",
            "device_analysis": "http://localhost:8002/ai/device-analysis/ZHPESS232A230002?prompt_type=performance"
        }
    }

@app.get("/dashboard")
def get_dashboard():
    """Serve the BESS monitoring dashboard"""
    return FileResponse("templates/bms_dashboard.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=API_HOST, port=API_PORT)