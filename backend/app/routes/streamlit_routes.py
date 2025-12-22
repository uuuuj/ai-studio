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


@router.get("/status")
async def get_status():
    """
    Get the status of the Streamlit app
    """
    return streamlit_service.status()
