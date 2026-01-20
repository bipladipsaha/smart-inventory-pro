"""API routes."""
from app.routes.auth import auth_bp
from app.routes.inventory import inventory_bp
from app.routes.orders import orders_bp

__all__ = ["auth_bp", "inventory_bp", "orders_bp"]
