"""Order routes for purchase and billing operations."""
from flask import Blueprint, request, jsonify, g
from app.models.order import OrderModel
from app.middleware.auth import jwt_required, buyer_required, owner_required

orders_bp = Blueprint("orders", __name__, url_prefix="/orders")


@orders_bp.route("", methods=["POST"])
@jwt_required
@buyer_required
def create_order():
    """Create a new order (purchase). Buyer only.
    
    Request body:
        {
            "items": [
                {"productId": "...", "quantity": 2},
                {"productId": "...", "quantity": 1}
            ]
        }
    
    This endpoint:
    - Validates stock availability
    - Deducts stock from inventory
    - Creates order record
    - Returns bill/receipt
    """
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    
    items = data.get("items", [])
    
    if not items or len(items) == 0:
        return jsonify({"error": "Order must contain at least one item"}), 400
    
    try:
        order = OrderModel.create(
            buyer_id=g.current_user["id"],
            items=items
        )
        
        return jsonify({
            "message": "Order placed successfully",
            "order": order
        }), 201
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to create order: {str(e)}"}), 500


@orders_bp.route("", methods=["GET"])
@jwt_required
def get_orders():
    """Get orders based on user role.
    
    - Buyer: Gets only their own orders
    - Owner: Gets all orders
    """
    user = g.current_user
    
    if user["role"] == "owner":
        orders = OrderModel.find_all()
    else:
        orders = OrderModel.find_by_buyer(user["id"])
    
    return jsonify({"orders": orders}), 200


@orders_bp.route("/<order_id>", methods=["GET"])
@jwt_required
def get_order(order_id):
    """Get a specific order by ID.
    
    - Buyer: Can only access their own orders
    - Owner: Can access any order
    """
    user = g.current_user
    
    if user["role"] == "owner":
        order = OrderModel.find_by_id(order_id)
    else:
        order = OrderModel.find_by_id(order_id, buyer_id=user["id"])
    
    if not order:
        return jsonify({"error": "Order not found"}), 404
    
    return jsonify({"order": order}), 200


@orders_bp.route("/<order_id>/status", methods=["PATCH"])
@jwt_required
@owner_required
def update_order_status(order_id):
    """Update order status. Owner only.
    
    Request body:
        {"status": "completed"} | {"status": "pending"} | {"status": "cancelled"}
    """
    data = request.get_json()
    
    if not data or "status" not in data:
        return jsonify({"error": "Status is required"}), 400
    
    try:
        order = OrderModel.update_status(order_id, data["status"])
        
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        return jsonify({
            "message": "Order status updated successfully",
            "order": order
        }), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to update status: {str(e)}"}), 500
