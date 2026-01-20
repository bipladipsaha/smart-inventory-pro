"""User model and database operations."""
from datetime import datetime
from typing import Optional
from bson import ObjectId
import bcrypt
from app.db import get_db


class UserModel:
    """User model for authentication and authorization."""
    
    ROLES = ["owner", "buyer"]
    
    @staticmethod
    def create(name: str, email: str, password: str, role: str) -> dict:
        """Create a new user with hashed password."""
        if role not in UserModel.ROLES:
            raise ValueError(f"Invalid role. Must be one of: {UserModel.ROLES}")
        
        db = get_db()
        
        # Hash password
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"), 
            bcrypt.gensalt()
        ).decode("utf-8")
        
        user_doc = {
            "name": name,
            "email": email.lower(),
            "passwordHash": password_hash,
            "role": role,
            "createdAt": datetime.utcnow()
        }
        
        result = db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        
        return UserModel._serialize(user_doc)
    
    @staticmethod
    def find_by_email(email: str) -> Optional[dict]:
        """Find a user by email address."""
        db = get_db()
        user = db.users.find_one({"email": email.lower()})
        return user
    
    @staticmethod
    def find_by_id(user_id: str) -> Optional[dict]:
        """Find a user by ID."""
        db = get_db()
        try:
            user = db.users.find_one({"_id": ObjectId(user_id)})
            return user
        except Exception:
            return None
    
    @staticmethod
    def verify_password(user: dict, password: str) -> bool:
        """Verify a password against the stored hash."""
        return bcrypt.checkpw(
            password.encode("utf-8"),
            user["passwordHash"].encode("utf-8")
        )
    
    @staticmethod
    def _serialize(user: dict) -> dict:
        """Serialize user for API response (exclude password)."""
        return {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "createdAt": user["createdAt"].isoformat()
        }
