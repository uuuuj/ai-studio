from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class Message(BaseModel):
    role: str = Field(..., description="Role of the message sender (user, assistant, system)")
    content: str = Field(..., description="Content of the message")


class ChatRequest(BaseModel):
    messages: List[Message] = Field(..., description="List of conversation messages")
    model: str = Field(default="gpt-3.5-turbo", description="LLM model to use")
    temperature: Optional[float] = Field(default=0.7, ge=0, le=2, description="Sampling temperature")
    max_tokens: Optional[int] = Field(default=1000, gt=0, description="Maximum tokens to generate")
    stream: Optional[bool] = Field(default=False, description="Whether to stream the response")
    provider: str = Field(default="openai", description="LLM provider (openai, anthropic, etc.)")


class ChatResponse(BaseModel):
    message: str = Field(..., description="Generated response message")
    model: str = Field(..., description="Model used for generation")
    usage: Optional[Dict[str, Any]] = Field(default=None, description="Token usage information")
    provider: str = Field(..., description="LLM provider used")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(default=None, description="Detailed error information")
