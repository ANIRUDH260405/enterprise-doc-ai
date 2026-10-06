from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./app.db"
    secret_key: str = "development-secret-key"
    environment: str = "development"
    groq_api_key: str = ""


settings = Settings()
