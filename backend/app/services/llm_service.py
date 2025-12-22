from typing import Dict, Any, AsyncIterator
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from app.config import settings
from app.models.llm_models import ChatRequest, ChatResponse


class LLMService:
    def __init__(self):
        self.openai_client = None
        self.anthropic_client = None

        if settings.OPENAI_API_KEY:
            self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        if settings.ANTHROPIC_API_KEY:
            self.anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def chat_completion(self, request: ChatRequest) -> ChatResponse:
        """
        Process chat completion request using specified LLM provider
        """
        provider = request.provider.lower()

        if provider == "openai":
            return await self._openai_chat(request)
        elif provider == "anthropic":
            return await self._anthropic_chat(request)
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    async def _openai_chat(self, request: ChatRequest) -> ChatResponse:
        """
        Handle OpenAI chat completion
        """
        if not self.openai_client:
            raise ValueError("OpenAI API key not configured")

        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]

        response = await self.openai_client.chat.completions.create(
            model=request.model,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

        return ChatResponse(
            message=response.choices[0].message.content,
            model=response.model,
            usage=response.usage.model_dump() if hasattr(response, 'usage') else None,
            provider="openai"
        )

    async def _anthropic_chat(self, request: ChatRequest) -> ChatResponse:
        """
        Handle Anthropic (Claude) chat completion
        """
        if not self.anthropic_client:
            raise ValueError("Anthropic API key not configured")

        # Convert messages to Anthropic format
        system_message = None
        messages = []

        for msg in request.messages:
            if msg.role == "system":
                system_message = msg.content
            else:
                messages.append({"role": msg.role, "content": msg.content})

        kwargs = {
            "model": request.model,
            "messages": messages,
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
        }

        if system_message:
            kwargs["system"] = system_message

        response = await self.anthropic_client.messages.create(**kwargs)

        return ChatResponse(
            message=response.content[0].text,
            model=response.model,
            usage={
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens,
            } if hasattr(response, 'usage') else None,
            provider="anthropic"
        )

    async def stream_chat_completion(self, request: ChatRequest) -> AsyncIterator[str]:
        """
        Stream chat completion response
        """
        provider = request.provider.lower()

        if provider == "openai":
            async for chunk in self._openai_stream(request):
                yield chunk
        elif provider == "anthropic":
            async for chunk in self._anthropic_stream(request):
                yield chunk
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    async def _openai_stream(self, request: ChatRequest) -> AsyncIterator[str]:
        """
        Stream OpenAI chat completion
        """
        if not self.openai_client:
            raise ValueError("OpenAI API key not configured")

        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]

        stream = await self.openai_client.chat.completions.create(
            model=request.model,
            messages=messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            stream=True,
        )

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    async def _anthropic_stream(self, request: ChatRequest) -> AsyncIterator[str]:
        """
        Stream Anthropic chat completion
        """
        if not self.anthropic_client:
            raise ValueError("Anthropic API key not configured")

        system_message = None
        messages = []

        for msg in request.messages:
            if msg.role == "system":
                system_message = msg.content
            else:
                messages.append({"role": msg.role, "content": msg.content})

        kwargs = {
            "model": request.model,
            "messages": messages,
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
            "stream": True,
        }

        if system_message:
            kwargs["system"] = system_message

        async with self.anthropic_client.messages.stream(**kwargs) as stream:
            async for text in stream.text_stream:
                yield text


llm_service = LLMService()
