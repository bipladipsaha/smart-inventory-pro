"""Flask application factory."""
from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.routes import auth_bp, inventory_bp, orders_bp


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app, origins=Config.CORS_ORIGINS, supports_credentials=True)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(orders_bp)
    
    # Health check endpoint
    @app.route("/health", methods=["GET"])
    def health_check():
        return {"status": "healthy"}, 200
    
    return app
