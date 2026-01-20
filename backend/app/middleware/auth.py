"""JWT authentication and authorization middleware."""
from functools import wraps
from flask import request, jsonify, g
import jwt
from app.config import Config
from app.models.user import UserModel


def jwt_required(f):
    """Decorator to require valid JWT token for a route."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"error": "Authentication token is missing"}), 401
        
        try:
            # Decode and verify token
            payload = jwt.decode(
                token,
                Config.JWT_SECRET_KEY,
                algorithms=["HS256"]
            )
            
            # Get user from database
            user = UserModel.find_by_id(payload["user_id"])
            if not user:
                return jsonify({"error": "User not found"}), 401
            
            # Store user info in Flask's g object for use in routes
            g.current_user = {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
            
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        
        return f(*args, **kwargs)
    
    return decorated


def owner_required(f):
    """Decorator to require owner role (must be used after jwt_required)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(g, "current_user"):
            return jsonify({"error": "Authentication required"}), 401
        
        if g.current_user["role"] != "owner":
            return jsonify({"error": "Owner access required"}), 403
        
        return f(*args, **kwargs)
    
    return decorated


def buyer_required(f):
    """Decorator to require buyer role (must be used after jwt_required)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(g, "current_user"):
            return jsonify({"error": "Authentication required"}), 401
        
        if g.current_user["role"] != "buyer":
            return jsonify({"error": "Buyer access required"}), 403
        
        return f(*args, **kwargs)
    
    return decorated
