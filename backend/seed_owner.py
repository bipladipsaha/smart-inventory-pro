"""Seed script to create the pre-defined owner account.

Run this script once to create the owner account in the database.
Owner credentials:
    Email: owner@inventory.local
    Password: owner123

Usage:
    python seed_owner.py
"""
import sys
from datetime import datetime
import bcrypt
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

# Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "inventory_db")

# Owner credentials - CHANGE IN PRODUCTION
OWNER_EMAIL = "owner@inventory.local"
OWNER_PASSWORD = "owner123"
OWNER_NAME = "Store Owner"


def seed_owner():
    """Create the pre-defined owner account."""
    print(f"Connecting to MongoDB at {MONGODB_URI}...")
    
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DB_NAME]
    
    # Check if owner already exists
    existing_owner = db.users.find_one({"email": OWNER_EMAIL})
    if existing_owner:
        print(f"Owner account already exists: {OWNER_EMAIL}")
        print("No changes made.")
        return
    
    # Hash password
    password_hash = bcrypt.hashpw(
        OWNER_PASSWORD.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")
    
    # Create owner document
    owner_doc = {
        "name": OWNER_NAME,
        "email": OWNER_EMAIL,
        "passwordHash": password_hash,
        "role": "owner",
        "createdAt": datetime.utcnow()
    }
    
    # Insert owner
    result = db.users.insert_one(owner_doc)
    
    print("=" * 50)
    print("Owner account created successfully!")
    print("=" * 50)
    print(f"Email:    {OWNER_EMAIL}")
    print(f"Password: {OWNER_PASSWORD}")
    print(f"Name:     {OWNER_NAME}")
    print(f"ID:       {result.inserted_id}")
    print("=" * 50)
    print("\n⚠️  IMPORTANT: Change these credentials in production!")
    
    client.close()


if __name__ == "__main__":
    seed_owner()
