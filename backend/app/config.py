from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # API Keys
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS Configuration
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]

    # Application Settings
    APP_NAME: str = "AI Studio Backend"
    DEBUG: bool = True

    # MSSQL Database Configuration
    MSSQL_SERVER: Optional[str] = None
    MSSQL_PORT: int = 1433
    MSSQL_DATABASE: Optional[str] = None
    MSSQL_USERNAME: Optional[str] = None
    MSSQL_PASSWORD: Optional[str] = None
    MSSQL_DRIVER: str = "{ODBC Driver 17 for SQL Server}"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
