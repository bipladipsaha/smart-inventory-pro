"""Application configuration from environment variables."""
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Flask application configuration."""
    
    # MongoDB
    # MongoDB Atlas connection string with URL-encoded password support
    # Format: mongodb+srv://USER:PASSWORD@cluster.mongodb.net/inventory_db
    # Password should be URL-encoded if it contains special characters
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "inventory_db")
    
    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default-secret-key")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    
    # CORS - Support multiple origins (comma-separated)
    # In production, set: CORS_ORIGINS=https://your-app.vercel.app,https://www.yourdomain.com
    cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    CORS_ORIGINS = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
