"""Authentication routes."""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
import jwt
from email_validator import validate_email, EmailNotValidError
from pymongo.errors import DuplicateKeyError
from app.config import Config
from app.models.user import UserModel

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new BUYER user only.
    
    Owner registration is NOT allowed - owner account is pre-seeded.
    """
    data = request.get_json()
    
    # Validate required fields (role is NOT required - always buyer)
    required_fields = ["name", "email", "password"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400
    
    name = data["name"].strip()
    email = data["email"].strip()
    password = data["password"]
    
    # IMPORTANT: Only buyer registration is allowed
    # Reject any attempt to register as owner
    if data.get("role", "").lower() == "owner":
        return jsonify({"error": "Owner registration is not allowed"}), 403
    
    # Force role to buyer
    role = "buyer"
    
    # Validate name
    if len(name) < 2:
        return jsonify({"error": "Name must be at least 2 characters"}), 400
    
    # Validate email
    try:
        valid = validate_email(email)
        email = valid.email
    except EmailNotValidError as e:
        return jsonify({"error": str(e)}), 400
    
    # Validate password
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    
    try:
        user = UserModel.create(name, email, password, role)
        
        # Generate JWT token
        token = _generate_token(user["id"])
        
        return jsonify({
            "message": "User registered successfully",
            "user": user,
            "token": token
        }), 201
        
    except DuplicateKeyError:
        return jsonify({"error": "Email already registered"}), 409
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """Login an existing user."""
    data = request.get_json()
    
    # Validate required fields
    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400
    
    email = data["email"].strip().lower()
    password = data["password"]
    
    # Find user
    user = UserModel.find_by_email(email)
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Verify password
    if not UserModel.verify_password(user, password):
        return jsonify({"error": "Invalid email or password"}), 401
    
    # Generate JWT token
    token = _generate_token(str(user["_id"]))
    
    # Serialize user for response
    user_response = {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    }
    
    return jsonify({
        "message": "Login successful",
        "user": user_response,
        "token": token
    }), 200


def _generate_token(user_id: str) -> str:
    """Generate a JWT token for a user."""
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm="HS256")
