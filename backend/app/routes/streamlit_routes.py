from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.streamlit_service import streamlit_service

router = APIRouter(prefix="/api/streamlit", tags=["Streamlit"])


class StreamlitRunRequest(BaseModel):
    code: str


@router.post("/run")
async def run_streamlit(request: StreamlitRunRequest):
    """
    Save and run a Streamlit app
    """
    try:
        result = streamlit_service.run(request.code)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop")
async def stop_streamlit():
    """
    Stop the running Streamlit app
    """
    try:
        result = streamlit_service.stop()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save")
async def save_streamlit_code(request: StreamlitRunRequest):
    """
    Save code to app.py without restarting Streamlit.
    Streamlit's file watcher will detect the change and auto-reload.
    This enables hot-reloading functionality.
    """
    try:
        # Only save if Streamlit is running
        status = streamlit_service.status()
        if not status.get("running"):
            raise HTTPException(
                status_code=400,
                detail="Streamlit is not running. Use /run endpoint first."
            )

        streamlit_service.save_code(request.code)
        return {
            "status": "saved",
            "message": "Code saved. Streamlit will auto-reload."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_status():
    """
    Get the status of the Streamlit app
    """
    return streamlit_service.status()
