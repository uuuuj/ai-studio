# AI Studio Project

## Overview
AI Studio is a web-based IDE for generating and running Streamlit applications using Claude AI. The project consists of a React frontend with Monaco Editor integration and a Python FastAPI backend that manages LLM API calls and Streamlit app execution.

## Project Structure

```
ai-studio/
├── .claude/
│   ├── CLAUDE.md                    # This file
│   └── rules/                       # Modular rules (auto-loaded)
│       ├── backend/
│       │   ├── fastapi.md          # FastAPI development rules
│       │   └── streamlit-service.md # Streamlit service rules
│       ├── frontend/
│       │   └── react.md            # React/Monaco Editor rules
│       ├── streamlit/
│       │   └── generation.md       # Streamlit code generation guidelines
│       └── general/
│           └── code-style.md       # General coding standards
├── backend/                         # Python FastAPI backend
├── cursor-mockup/                  # React frontend
├── Dockerfile
└── docker-compose.yml
```

## Technology Stack

### Backend
- Python 3.12, FastAPI, Uvicorn
- Anthropic SDK (AsyncAnthropic), OpenAI SDK (AsyncOpenAI)
- Streamlit for generated apps

### Frontend
- React 18, Vite, Monaco Editor
- Tailwind CSS, Lucide React

## Key Features
1. AI-powered Streamlit code generation (Claude API)
2. Monaco Editor with auto-save, export, reset
3. Auto-package detection and installation
4. Live Streamlit preview with loading feedback

## API Endpoints
- `POST /api/llm/chat` - Send prompt to LLM
- `POST /api/streamlit/run` - Run Streamlit app
- `POST /api/streamlit/stop` - Stop app
- `GET /api/streamlit/status` - Get status

---

## Git Workflow

### 커밋 규칙
- 작업 한 단위(기능 구현, 버그 수정, 리팩토링 등)가 완료되면 반드시 git commit과 push를 수행
- 커밋 전에 `git status`와 `git diff`로 변경사항을 먼저 확인하고 요약해서 알려줄 것
- push 전에 현재 브랜치가 올바른지 확인

### 커밋 메시지 형식
Conventional Commits 형식을 따름:
- `feat:` 새로운 기능 추가
- `fix:` 버그 수정
- `docs:` 문서 수정
- `refactor:` 코드 리팩토링
- `test:` 테스트 코드 추가/수정
- `chore:` 빌드, 설정 파일 등 기타 변경

예시: `feat: 사용자 로그인 API 구현`

### 작업 완료 체크리스트
1. 코드 변경사항 확인 (`git diff`)
2. 민감정보 포함 여부 검토
3. 커밋 메시지 작성
4. 커밋 및 푸시
5. 작업 결과 요약 보고

---

## 민감정보 보호 (Critical)

### 절대 커밋하지 말아야 할 파일/정보
- API 키, 시크릿 키, 토큰
- 데이터베이스 비밀번호, 접속 정보
- AWS/클라우드 자격증명
- SSL 인증서, 개인키 (.pem, .key)
- 환경변수 파일 (.env, .env.local, .env.production)
- IDE 설정 및 개인 설정 파일

### .gitignore 필수 포함 항목
커밋 전 아래 항목들이 .gitignore에 포함되어 있는지 확인:

```
# 환경변수
.env
.env.*
*.env

# 시크릿/인증
*.pem
*.key
*.crt
secrets/
credentials/

# 설정 파일 (민감정보 포함 가능)
config/local.py
settings/local.py
*_secret*
*_credentials*

# IDE/에디터
.idea/
.vscode/
*.swp
*.swo

# 로그 및 캐시
*.log
__pycache__/
*.pyc
.cache/

# OS 파일
.DS_Store
Thumbs.db

# 빌드/의존성
node_modules/
venv/
.venv/
dist/
build/
*.egg-info/
```

### 민감정보 발견 시 대응
1. 즉시 커밋 중단
2. 해당 파일을 .gitignore에 추가
3. 환경변수 또는 별도 시크릿 관리 방식으로 분리 권장
4. 이미 커밋된 경우 히스토리에서 제거 필요함을 알림

---

## 코드 작업 규칙

### 작업 시작 전
- 현재 브랜치 확인: `git branch`
- 최신 코드 동기화: `git pull`

### 작업 중
- 큰 기능은 작은 단위로 나눠서 커밋
- 관련 없는 변경사항은 별도 커밋으로 분리

### 작업 완료 후
- 테스트 실행 (있는 경우)
- 린트/포맷팅 검사
- 커밋 및 푸시
- 작업 내용 간략히 보고

---

## 예외 상황

### Push 전 확인 요청이 필요한 경우
- main/master 브랜치에 직접 푸시할 때
- 대규모 변경사항 (10개 이상 파일 수정)
- 삭제 작업이 포함된 경우
- 데이터베이스 마이그레이션 파일 포함 시

### 커밋하지 않는 경우
- 작업이 중간 상태일 때
- 테스트가 실패한 상태
- 명시적으로 커밋하지 말라고 지시받은 경우

---

## Development Workflow

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd cursor-mockup
npm install
npm run dev  # http://localhost:5173
```

### Docker
```bash
docker-compose up -d --build
docker-compose logs -f
docker-compose down
```

## Environment Configuration

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
DEBUG=True
```

**Ports**: Frontend (5173), Backend (8000), Streamlit (8501)

## Memory Management
- All `.md` files in `.claude/rules/` are auto-loaded
- Path-specific rules use YAML frontmatter with `paths` field
- Keep rules focused and organized by domain
