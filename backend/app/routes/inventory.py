"""Inventory routes with role-based access control."""
import io
import base64
from flask import Blueprint, request, jsonify, g
import qrcode
from app.models.inventory import InventoryModel
from app.middleware.auth import jwt_required, owner_required
from app.middleware.rate_limit import rate_limit

inventory_bp = Blueprint("inventory", __name__, url_prefix="/items")


@inventory_bp.route("", methods=["GET"])
@jwt_required
def get_all_items():
    """Get all inventory items. Accessible by both Owner and Buyer."""
    items = InventoryModel.find_all()
    return jsonify({"items": items}), 200


@inventory_bp.route("/<item_id>", methods=["GET"])
@jwt_required
def get_item(item_id):
    """Get a single inventory item by ID."""
    item = InventoryModel.find_by_id(item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404
    return jsonify({"item": item}), 200


@inventory_bp.route("/qr/<qr_token>", methods=["GET"])
@rate_limit()
def get_item_by_qr_public(qr_token):
    """PUBLIC: Get inventory item by QR token.
    
    This endpoint is PUBLIC and does NOT require authentication.
    It returns only limited, non-sensitive product information:
    - name, category, price, quantity, updatedAt
    
    Rate-limited to prevent abuse.
    
    Response Example:
        {
            "name": "Basmati Rice",
            "category": "Grains",
            "price": 60,
            "quantity": 45,
            "updatedAt": "2026-01-18T10:20:00"
        }
    """
    item = InventoryModel.find_by_qr_token_public(qr_token)
    if not item:
        return jsonify({"error": "Item not found"}), 404
    return jsonify(item), 200


@inventory_bp.route("/lookup/<qr_code>", methods=["GET"])
@jwt_required
def get_item_by_qr_authenticated(qr_code):
    """AUTHENTICATED: Get full inventory item details by QR code.
    
    This endpoint requires JWT authentication and returns full item details.
    """
    item = InventoryModel.find_by_qr_code(qr_code)
    if not item:
        return jsonify({"error": "Item not found"}), 404
    return jsonify({"item": item}), 200


@inventory_bp.route("", methods=["POST"])
@jwt_required
@owner_required
def create_item():
    """Create a new inventory item. Owner only."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ["name", "category", "quantity", "price"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400
    
    name = data["name"].strip()
    category = data["category"].strip()
    
    # Validate and parse quantity
    try:
        quantity = int(data["quantity"])
    except (ValueError, TypeError):
        return jsonify({"error": "Quantity must be a valid integer"}), 400
    
    # Validate and parse price
    try:
        price = float(data["price"])
    except (ValueError, TypeError):
        return jsonify({"error": "Price must be a valid number"}), 400
    
    # Validate name
    if len(name) < 1:
        return jsonify({"error": "Name cannot be empty"}), 400
    
    # Validate category
    if len(category) < 1:
        return jsonify({"error": "Category cannot be empty"}), 400
    
    try:
        item = InventoryModel.create(
            name=name,
            category=category,
            quantity=quantity,
            price=price,
            created_by=g.current_user["id"]
        )
        return jsonify({
            "message": "Item created successfully",
            "item": item
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inventory_bp.route("/<item_id>", methods=["PUT"])
@jwt_required
@owner_required
def update_item(item_id):
    """Update an inventory item. Owner only."""
    data = request.get_json()
    
    # Check if item exists
    existing_item = InventoryModel.find_by_id(item_id)
    if not existing_item:
        return jsonify({"error": "Item not found"}), 404
    
    # Build update fields
    update_kwargs = {}
    
    if "name" in data:
        name = data["name"].strip()
        if len(name) < 1:
            return jsonify({"error": "Name cannot be empty"}), 400
        update_kwargs["name"] = name
    
    if "category" in data:
        category = data["category"].strip()
        if len(category) < 1:
            return jsonify({"error": "Category cannot be empty"}), 400
        update_kwargs["category"] = category
    
    if "quantity" in data:
        try:
            update_kwargs["quantity"] = int(data["quantity"])
        except (ValueError, TypeError):
            return jsonify({"error": "Quantity must be a valid integer"}), 400
    
    if "price" in data:
        try:
            update_kwargs["price"] = float(data["price"])
        except (ValueError, TypeError):
            return jsonify({"error": "Price must be a valid number"}), 400
    
    if not update_kwargs:
        return jsonify({"error": "No fields to update"}), 400
    
    try:
        item = InventoryModel.update(item_id, **update_kwargs)
        if not item:
            return jsonify({"error": "Failed to update item"}), 500
        return jsonify({
            "message": "Item updated successfully",
            "item": item
        }), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@inventory_bp.route("/<item_id>", methods=["DELETE"])
@jwt_required
@owner_required
def delete_item(item_id):
    """Delete an inventory item. Owner only."""
    # Check if item exists
    existing_item = InventoryModel.find_by_id(item_id)
    if not existing_item:
        return jsonify({"error": "Item not found"}), 404
    
    if InventoryModel.delete(item_id):
        return jsonify({"message": "Item deleted successfully"}), 200
    else:
        return jsonify({"error": "Failed to delete item"}), 500


@inventory_bp.route("/<item_id>/qr-image", methods=["GET"])
@jwt_required
def get_qr_image(item_id):
    """Generate and return QR code image as base64."""
    item = InventoryModel.find_by_id(item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(item["qrCode"])
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    
    return jsonify({
        "qrCode": item["qrCode"],
        "qrImage": f"data:image/png;base64,{img_base64}"
    }), 200
