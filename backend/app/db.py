"""MongoDB database connection and initialization."""
from pymongo import MongoClient, ASCENDING
from pymongo.database import Database
from app.config import Config

# Global database client and db reference
_client: MongoClient | None = None
_db: Database | None = None


def get_db() -> Database:
    """Get the MongoDB database instance."""
    global _client, _db
    
    if _db is None:
        _client = MongoClient(Config.MONGODB_URI)
        _db = _client[Config.MONGODB_DB_NAME]
        _create_indexes(_db)
    
    return _db


def _create_indexes(db: Database) -> None:
    """Create necessary indexes for collections."""
    # Users collection - unique email index
    db.users.create_index([("email", ASCENDING)], unique=True)
    
    # Inventory collection - unique qrCode index
    db.inventory.create_index([("qrCode", ASCENDING)], unique=True)
    db.inventory.create_index([("category", ASCENDING)])
    db.inventory.create_index([("createdBy", ASCENDING)])


def close_db() -> None:
    """Close the database connection."""
    global _client, _db
    
    if _client is not None:
        _client.close()
        _client = None
        _db = None
