# AI Studio Backend

A FastAPI-based backend server that acts as a proxy for LLM API services. Supports multiple LLM providers including OpenAI and Anthropic.

## Features

- Multiple LLM Provider Support (OpenAI, Anthropic Claude)
- RESTful API endpoints for chat completions
- Streaming response support
- CORS enabled for frontend integration
- Environment-based configuration
- Comprehensive error handling
- Auto-generated API documentation

## Project Structure

```
backend/
├── app/
│   ├── models/          # Pydantic models for request/response
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic and LLM integrations
│   ├── config.py        # Configuration management
│   └── main.py          # FastAPI application entry point
├── .env                 # Environment variables (create from .env.example)
├── .env.example         # Environment template
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Setup Instructions

### 1. Create Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API keys
# Required: At least one LLM provider API key
```

Example `.env` file:
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

### 4. Run the Server

```bash
# Development mode (with auto-reload)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or run directly
python app/main.py
```

The server will start at `http://localhost:8000`

## API Documentation

Once the server is running, access the interactive API documentation:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Health Check

```http
GET /health
GET /api/llm/health
```

Check if the server and LLM providers are configured correctly.

### Chat Completion

```http
POST /api/llm/chat
```

Request body:
```json
{
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ],
  "model": "gpt-3.5-turbo",
  "provider": "openai",
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

Response:
```json
{
  "message": "I'm doing well, thank you for asking!",
  "model": "gpt-3.5-turbo",
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 10,
    "total_tokens": 22
  },
  "provider": "openai"
}
```

### List Models

```http
GET /api/llm/models
```

Get a list of available models from configured providers.

## Supported LLM Providers

### OpenAI
- Models: gpt-4, gpt-3.5-turbo, etc.
- Required: `OPENAI_API_KEY` in `.env`

### Anthropic (Claude)
- Models: claude-3-opus, claude-3-sonnet, claude-3-haiku
- Required: `ANTHROPIC_API_KEY` in `.env`

## Usage Examples

### Using with curl

```bash
# Chat completion
curl -X POST "http://localhost:8000/api/llm/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "model": "gpt-3.5-turbo",
    "provider": "openai"
  }'
```

### Using with JavaScript/Fetch

```javascript
const response = await fetch('http://localhost:8000/api/llm/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }],
    model: 'gpt-3.5-turbo',
    provider: 'openai',
    temperature: 0.7,
    max_tokens: 1000
  })
});

const data = await response.json();
console.log(data.message);
```

### Streaming Responses

```javascript
const response = await fetch('http://localhost:8000/api/llm/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Tell me a story' }],
    model: 'gpt-3.5-turbo',
    provider: 'openai',
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      const parsed = JSON.parse(data);
      console.log(parsed.content);
    }
  }
}
```

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (default React dev server)
- `http://localhost:5173` (default Vite dev server)

To add more origins, update `CORS_ORIGINS` in `.env` or `app/config.py`.

## Development

### Adding a New LLM Provider

1. Update `app/services/llm_service.py` with new provider client
2. Add provider-specific methods (e.g., `_newprovider_chat`)
3. Update `chat_completion` method to handle new provider
4. Add API key configuration in `app/config.py`
5. Update `.env.example` with new environment variables

### Testing

```bash
# Run the server
python app/main.py

# In another terminal, test the endpoints
curl http://localhost:8000/health
```

## Troubleshooting

### Port Already in Use
If port 8000 is already in use, change the `PORT` in `.env` file.

### API Key Errors
Make sure your API keys are properly set in the `.env` file and are valid.

### CORS Errors
Add your frontend URL to `CORS_ORIGINS` in the configuration.

## License

MIT
