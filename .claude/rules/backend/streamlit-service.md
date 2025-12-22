---
paths: backend/app/services/streamlit_service.py
---

# Streamlit Service Rules

## Purpose
Manages Streamlit app lifecycle: running, stopping, and auto-installing packages.

## Key Features

### Auto Package Installation
- Extract imports from generated code
- Auto-install missing packages using pip
- Skip standard library packages
- Report installed and failed packages

### Process Management
- Single Streamlit process per service instance
- Stop existing process before starting new one
- Handle Windows/Unix differences properly
- Use `subprocess.Popen` with proper flags

### File Management
- Save code to `app.py` (not `generated_app.py`)
- Use Path objects for file paths
- Default port: 8501

## Example Usage
```python
from app.services.streamlit_service import streamlit_service

# Run Streamlit app with auto package installation
result = streamlit_service.run(code)
# Returns: {"status": "running", "url": "http://localhost:8501", "pid": 12345}

# Stop running app
result = streamlit_service.stop()
# Returns: {"status": "stopped"}

# Check status
status = streamlit_service.status()
# Returns: {"running": True/False, "url": "...", "pid": ...}
```

## Important Notes
- Package installation happens before running app
- Install timeout: 60 seconds per package
- Process waits 3 seconds after start to verify success
- Windows requires special signal handling for clean shutdown
