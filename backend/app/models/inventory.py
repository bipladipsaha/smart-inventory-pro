"""Inventory model and database operations."""
from datetime import datetime
from typing import Optional, List
from bson import ObjectId
import uuid
from app.db import get_db


class InventoryModel:
    """Inventory model for product management."""
    
    @staticmethod
    def create(
        name: str,
        category: str,
        quantity: int,
        price: float,
        created_by: str
    ) -> dict:
        """Create a new inventory item with unique QR code."""
        if quantity < 0:
            raise ValueError("Quantity cannot be negative")
        if price < 0:
            raise ValueError("Price cannot be negative")
        
        db = get_db()
        
        # Generate unique QR code
        qr_code = f"INV-{uuid.uuid4().hex[:12].upper()}"
        
        item_doc = {
            "name": name,
            "category": category,
            "quantity": quantity,
            "price": price,
            "qrCode": qr_code,
            "createdBy": ObjectId(created_by),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = db.inventory.insert_one(item_doc)
        item_doc["_id"] = result.inserted_id
        
        return InventoryModel._serialize(item_doc)
    
    @staticmethod
    def find_all() -> List[dict]:
        """Get all inventory items."""
        db = get_db()
        items = db.inventory.find().sort("createdAt", -1)
        return [InventoryModel._serialize(item) for item in items]
    
    @staticmethod
    def find_by_id(item_id: str) -> Optional[dict]:
        """Find an inventory item by ID."""
        db = get_db()
        try:
            item = db.inventory.find_one({"_id": ObjectId(item_id)})
            return InventoryModel._serialize(item) if item else None
        except Exception:
            return None
    
    @staticmethod
    def find_by_qr_code(qr_code: str) -> Optional[dict]:
        """Find an inventory item by QR code."""
        db = get_db()
        item = db.inventory.find_one({"qrCode": qr_code})
        return InventoryModel._serialize(item) if item else None
    
    @staticmethod
    def update(
        item_id: str,
        name: Optional[str] = None,
        category: Optional[str] = None,
        quantity: Optional[int] = None,
        price: Optional[float] = None
    ) -> Optional[dict]:
        """Update an inventory item."""
        db = get_db()
        
        update_fields = {"updatedAt": datetime.utcnow()}
        
        if name is not None:
            update_fields["name"] = name
        if category is not None:
            update_fields["category"] = category
        if quantity is not None:
            if quantity < 0:
                raise ValueError("Quantity cannot be negative")
            update_fields["quantity"] = quantity
        if price is not None:
            if price < 0:
                raise ValueError("Price cannot be negative")
            update_fields["price"] = price
        
        try:
            result = db.inventory.find_one_and_update(
                {"_id": ObjectId(item_id)},
                {"$set": update_fields},
                return_document=True
            )
            return InventoryModel._serialize(result) if result else None
        except Exception:
            return None
    
    @staticmethod
    def delete(item_id: str) -> bool:
        """Delete an inventory item."""
        db = get_db()
        try:
            result = db.inventory.delete_one({"_id": ObjectId(item_id)})
            return result.deleted_count > 0
        except Exception:
            return False
    
    @staticmethod
    def find_by_qr_token_public(qr_token: str) -> Optional[dict]:
        """Find an inventory item by QR token and return public fields only.
        
        This method is designed for the public QR lookup API.
        Returns only non-sensitive fields suitable for public consumption.
        """
        db = get_db()
        item = db.inventory.find_one({"qrCode": qr_token})
        return InventoryModel._serialize_public(item) if item else None
    
    @staticmethod
    def _serialize(item: dict) -> dict:
        """Serialize inventory item for API response (authenticated users)."""
        return {
            "id": str(item["_id"]),
            "name": item["name"],
            "category": item["category"],
            "quantity": item["quantity"],
            "price": item["price"],
            "qrCode": item["qrCode"],
            "createdBy": str(item["createdBy"]),
            "createdAt": item["createdAt"].isoformat(),
            "updatedAt": item["updatedAt"].isoformat(),
            "lowStock": item["quantity"] < 10  # Low stock indicator
        }
    
    @staticmethod
    def _serialize_public(item: dict) -> dict:
        """Serialize inventory item for PUBLIC API response.
        
        Returns fields safe for public consumption + id for cart:
        - id, name, category, price, quantity, qrCode, inStock
        """
        return {
            "id": str(item["_id"]),
            "name": item["name"],
            "category": item["category"],
            "price": item["price"],
            "quantity": item["quantity"],
            "qrCode": item["qrCode"],
            "inStock": item["quantity"] > 0
        }
