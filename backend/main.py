from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="All-in-One Personal AI Assistant & Workspace Backend API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "operational",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
