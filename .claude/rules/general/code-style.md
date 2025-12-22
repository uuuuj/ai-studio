# General Code Style Guidelines

## Python Type Checking (CRITICAL)

### Type Hints 필수 요구사항
- **모든 Python 코드는 type hints 필수**
- 함수 파라미터와 반환 타입 모두 명시
- 변수 타입이 불명확한 경우 타입 힌트 추가

### Mypy 타입 체크 프로세스
1. **코드 작성 완료 후 반드시 mypy 실행**
   ```bash
   mypy backend/app/
   ```

2. **Mypy 에러 발생 시**
   - 에러 메시지를 정확히 분석
   - 타입 불일치, 누락된 타입 힌트 등 확인
   - 코드를 수정하여 타입 안정성 확보

3. **반복 검증**
   - Mypy가 에러 없이 통과할 때까지 수정 반복
   - 모든 타입 에러 해결 필수

4. **작업 완료 기준**
   - **Mypy 통과 후에만 작업 완료로 간주**
   - 타입 체크 실패 시 작업 미완료 상태

### Type Hints 예시

```python
from typing import Optional, List, Dict, Any
from pathlib import Path

# 함수 파라미터와 반환 타입 명시
def process_data(
    input_file: Path,
    max_records: int = 100,
    filters: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """Process data from file."""
    results: List[Dict[str, Any]] = []
    # 구현...
    return results

# 비동기 함수도 타입 힌트 필수
async def fetch_api(
    url: str,
    params: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Fetch data from API."""
    # 구현...
    return {}

# 클래스 메서드
class DataProcessor:
    def __init__(self, config: Dict[str, Any]) -> None:
        self.config: Dict[str, Any] = config

    def process(self, data: List[str]) -> List[int]:
        """Process string data to integers."""
        return [len(item) for item in data]
```

### 타입 체크 통과 예시
```bash
# 성공 케이스
$ mypy backend/app/
Success: no issues found in 25 source files

# 실패 케이스 (수정 필요)
$ mypy backend/app/
backend/app/services/llm_service.py:45: error: Function is missing a return type annotation
backend/app/routes/llm_routes.py:12: error: Argument 1 has incompatible type "str"; expected "int"
Found 2 errors in 2 files (checked 25 source files)
```

---

## Code Quality Principles

### Readability
- Write clear, self-documenting code
- Use descriptive variable and function names
- Keep functions focused and small
- Add comments only when logic isn't obvious

### Error Handling
- Always use try-except for external API calls
- Provide meaningful error messages
- Log errors for debugging
- Don't silently fail - inform the user

### Performance
- Use async/await for I/O operations
- Cache expensive computations (Streamlit: use @st.cache_data)
- Avoid unnecessary re-renders in React
- Debounce frequent operations (e.g., auto-save)

## Python Style (Backend & Streamlit)

### Naming Conventions
- `snake_case` for variables, functions, files
- `PascalCase` for classes
- `UPPER_CASE` for constants
- Descriptive names: `user_input` not `ui`, `process_data()` not `pd()`

### Imports
```python
# Standard library
import os
import sys
from pathlib import Path
from typing import Optional, List, Dict, Any

# Third-party
import streamlit as st
from fastapi import APIRouter

# Local
from app.services.llm_service import llm_service
```

## JavaScript/React Style (Frontend)

### Naming Conventions
- `camelCase` for variables, functions
- `PascalCase` for components
- `UPPER_CASE` for constants
- Descriptive names: `handleRunStreamlit` not `handleRun`

### React Hooks
```javascript
// State at top of component
const [isLoading, setIsLoading] = useState(false);
const [data, setData] = useState(null);

// Refs after state
const editorRef = useRef(null);

// Effects after refs
useEffect(() => {
  // Effect logic
  return () => {
    // Cleanup
  };
}, [dependencies]);
```

## Git Best Practices

### Commit Messages
- Use present tense: "Add feature" not "Added feature"
- Be descriptive but concise
- Reference issue numbers when applicable

### What NOT to Commit
- `.env` files (contains API keys)
- `node_modules/` and `__pycache__/`
- IDE-specific files (.vscode/, .idea/)
- Build artifacts (dist/, build/)

## Security

### API Keys
- Never hardcode API keys
- Use environment variables
- Never commit `.env` to git
- Use `.env.example` for documentation

### Input Validation
- Validate all user input
- Use Pydantic models for API request validation
- Sanitize data before display (prevent XSS)

### Error Messages
- Don't expose sensitive information in errors
- Log detailed errors server-side
- Show user-friendly messages client-side

---

## Workflow Summary

### Python 개발 워크플로우
1. 코드 작성 (type hints 포함)
2. `mypy backend/app/` 실행
3. 에러 분석 및 수정
4. Mypy 통과 확인
5. 작업 완료 보고

### 작업 완료 체크리스트
- [ ] Type hints 모든 함수/메서드에 추가됨
- [ ] Mypy 에러 없이 통과
- [ ] 코드 리뷰 가능 상태
- [ ] 민감정보 미포함 확인
- [ ] Git 커밋 준비 완료
