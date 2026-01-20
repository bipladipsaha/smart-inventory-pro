"""Order model for purchase and billing operations."""
from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from app.db import get_db


class OrderModel:
    """Order model for managing purchases and bills."""
    
    @staticmethod
    def create(buyer_id: str, items: List[dict]) -> dict:
        """Create a new order with stock validation and deduction.
        
        Args:
            buyer_id: The ID of the buyer making the purchase
            items: List of items to purchase, each with:
                - productId: Inventory item ID
                - quantity: Quantity to purchase
        
        Returns:
            The created order document
            
        Raises:
            ValueError: If stock is insufficient or items are invalid
        """
        if not items or len(items) == 0:
            raise ValueError("Order must contain at least one item")
        
        db = get_db()
        order_items = []
        total_amount = 0
        
        # Validate and prepare each item
        for item in items:
            product_id = item.get("productId")
            quantity = item.get("quantity", 0)
            
            if not product_id:
                raise ValueError("Each item must have a productId")
            if quantity <= 0:
                raise ValueError("Quantity must be greater than 0")
            
            # Get product from inventory
            try:
                product = db.inventory.find_one({"_id": ObjectId(product_id)})
            except Exception:
                raise ValueError(f"Invalid product ID: {product_id}")
            
            if not product:
                raise ValueError(f"Product not found: {product_id}")
            
            # Check stock availability
            if product["quantity"] < quantity:
                raise ValueError(
                    f"Insufficient stock for {product['name']}. "
                    f"Available: {product['quantity']}, Requested: {quantity}"
                )
            
            subtotal = product["price"] * quantity
            total_amount += subtotal
            
            order_items.append({
                "productId": ObjectId(product_id),
                "name": product["name"],
                "price": product["price"],
                "quantity": quantity,
                "subtotal": subtotal
            })
        
        # Deduct stock for all items (atomic operation per item)
        for order_item in order_items:
            result = db.inventory.update_one(
                {
                    "_id": order_item["productId"],
                    "quantity": {"$gte": order_item["quantity"]}  # Double-check stock
                },
                {
                    "$inc": {"quantity": -order_item["quantity"]},
                    "$set": {"updatedAt": datetime.utcnow()}
                }
            )
            
            if result.modified_count == 0:
                # Rollback previous deductions (best effort)
                # In production, use transactions
                raise ValueError(
                    f"Failed to deduct stock for {order_item['name']}. "
                    "Stock may have changed. Please try again."
                )
        
        # Create order document
        order_doc = {
            "buyerId": ObjectId(buyer_id),
            "items": order_items,
            "totalAmount": total_amount,
            "status": "completed",  # pending, completed, cancelled
            "createdAt": datetime.utcnow()
        }
        
        result = db.orders.insert_one(order_doc)
        order_doc["_id"] = result.inserted_id
        
        return OrderModel._serialize(order_doc)
    
    @staticmethod
    def find_by_buyer(buyer_id: str) -> List[dict]:
        """Get all orders for a specific buyer."""
        db = get_db()
        try:
            orders = db.orders.find(
                {"buyerId": ObjectId(buyer_id)}
            ).sort("createdAt", -1)
            return [OrderModel._serialize(order) for order in orders]
        except Exception:
            return []
    
    @staticmethod
    def find_all() -> List[dict]:
        """Get all orders (for owner view)."""
        db = get_db()
        orders = db.orders.find().sort("createdAt", -1)
        return [OrderModel._serialize(order) for order in orders]
    
    @staticmethod
    def find_by_id(order_id: str, buyer_id: Optional[str] = None) -> Optional[dict]:
        """Find an order by ID.
        
        Args:
            order_id: The order ID
            buyer_id: Optional buyer ID to restrict access
        """
        db = get_db()
        try:
            query = {"_id": ObjectId(order_id)}
            if buyer_id:
                query["buyerId"] = ObjectId(buyer_id)
            
            order = db.orders.find_one(query)
            return OrderModel._serialize(order) if order else None
        except Exception:
            return None
    
    @staticmethod
    def update_status(order_id: str, status: str) -> Optional[dict]:
        """Update order status.
        
        Args:
            order_id: The order ID
            status: New status (pending, completed, cancelled)
        
        Returns:
            Updated order or None if not found
        """
        if status not in ["pending", "completed", "cancelled"]:
            raise ValueError("Invalid status. Must be: pending, completed, or cancelled")
        
        db = get_db()
        try:
            result = db.orders.find_one_and_update(
                {"_id": ObjectId(order_id)},
                {"$set": {"status": status}},
                return_document=True
            )
            return OrderModel._serialize(result) if result else None
        except Exception:
            return None
    
    @staticmethod
    def _serialize(order: dict) -> dict:
        """Serialize order for API response."""
        # Get buyer info
        db = get_db()
        buyer = db.users.find_one({"_id": order["buyerId"]})
        buyer_name = buyer["name"] if buyer else "Unknown"
        
        return {
            "id": str(order["_id"]),
            "buyerId": str(order["buyerId"]),
            "buyerName": buyer_name,
            "items": [
                {
                    "productId": str(item["productId"]),
                    "name": item["name"],
                    "price": item["price"],
                    "quantity": item["quantity"],
                    "subtotal": item["subtotal"]
                }
                for item in order["items"]
            ],
            "totalAmount": order["totalAmount"],
            "status": order.get("status", "completed"),
            "createdAt": order["createdAt"].isoformat()
        }
