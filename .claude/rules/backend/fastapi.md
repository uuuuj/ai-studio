---
paths: backend/**/*.py
---

# FastAPI Backend Rules

## Technology Stack
- Python 3.12
- FastAPI with async/await patterns
- Pydantic for request/response validation
- CORS middleware for frontend integration
- Uvicorn server with hot-reload

## API Structure
- All routes in `backend/app/routes/`
- Services in `backend/app/services/`
- Models in `backend/app/models/`
- Configuration in `backend/app/config.py`

## Async Best Practices
- Use AsyncOpenAI and AsyncAnthropic clients (not synchronous)
- Always use `await` with async functions
- Use `async def` for route handlers that call external APIs

## Error Handling
- Always use try-except blocks for external API calls
- Return proper HTTP status codes
- Include descriptive error messages in responses

## Example API Pattern
```python
from fastapi import APIRouter, HTTPException
from app.models.request import ChatRequest
from app.services.llm_service import llm_service

router = APIRouter(prefix="/api/llm", tags=["llm"])

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = await llm_service.chat(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Environment Variables
- Store API keys in `.env` file (never commit)
- Use `settings` from `config.py` to access environment variables
- Required: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
