from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.llm_models import ChatRequest, ChatResponse, ErrorResponse
from app.services.llm_service import llm_service
import json
import traceback

router = APIRouter(prefix="/api/llm", tags=["LLM"])


@router.post("/chat", response_model=ChatResponse)
async def chat_completion(request: ChatRequest):
    """
    Process chat completion request

    Supports multiple LLM providers:
    - openai: OpenAI GPT models
    - anthropic: Anthropic Claude models
    """
    try:
        if request.stream:
            return StreamingResponse(
                stream_response(request),
                media_type="text/event-stream"
            )
        else:
            response = await llm_service.chat_completion(request)
            return response
    except ValueError as e:
        print(f"ValueError: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Exception: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


async def stream_response(request: ChatRequest):
    """
    Generator function for streaming responses
    """
    try:
        async for chunk in llm_service.stream_chat_completion(request):
            yield f"data: {json.dumps({'content': chunk})}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        error_data = {"error": str(e)}
        yield f"data: {json.dumps(error_data)}\n\n"


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "service": "AI Studio Backend",
        "providers": {
            "openai": llm_service.openai_client is not None,
            "anthropic": llm_service.anthropic_client is not None,
        }
    }


@router.get("/models")
async def list_models():
    """
    List available models from configured providers
    """
    models = {
        "openai": [
            "gpt-4-turbo-preview",
            "gpt-4",
            "gpt-3.5-turbo",
            "gpt-3.5-turbo-16k",
        ],
        "anthropic": [
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307",
        ]
    }

    available_models = {}
    if llm_service.openai_client:
        available_models["openai"] = models["openai"]
    if llm_service.anthropic_client:
        available_models["anthropic"] = models["anthropic"]

    return {"models": available_models}
