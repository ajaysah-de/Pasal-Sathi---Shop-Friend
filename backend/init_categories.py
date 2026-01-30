"""
Manual script to initialize categories and locations in the database
Run this once for existing shops that were created before the database storage feature
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

def get_default_categories():
    return [
        {"id": "steel", "name_en": "Steel Utensils", "name_np": "स्टिल भाँडा", "icon": "pot-steaming", "color": "#6B7280", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"id": "brass", "name_en": "Brass & Religious", "name_np": "पीतल/पूजा सामान", "icon": "lamp", "color": "#D4AF37", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"id": "plastic", "name_en": "Plastic Items", "name_np": "प्लास्टिक सामान", "icon": "cup-soda", "color": "#3B82F6", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"id": "electric", "name_en": "Electric Items", "name_np": "बिजुली सामान", "icon": "zap", "color": "#F59E0B", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"id": "cleaning", "name_en": "Cleaning Tools", "name_np": "सफाई सामान", "icon": "brush", "color": "#10B981", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"id": "boxed", "name_en": "Boxed Items", "name_np": "बक्स सामान", "icon": "package", "color": "#8B5CF6", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"id": "other", "name_en": "Other Items", "name_np": "अन्य सामान", "icon": "grid-3x3", "color": "#6B7280", "is_active": True, "created_at": datetime.now(timezone.utc)}
    ]

def get_default_locations():
    return [
        {"id": "hanging", "name_en": "Hanging", "name_np": "झुण्डिएको", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"id": "shelf_top", "name_en": "Top Shelf", "name_np": "माथि शेल्फ", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"id": "shelf_bottom", "name_en": "Bottom Shelf", "name_np": "तल शेल्फ", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"id": "front_display", "name_en": "Front Display", "name_np": "अगाडि राखेको", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"id": "storage", "name_en": "Storage Room", "name_np": "गोदाम", "is_active": True, "created_at": datetime.now(timezone.utc)},
        {"id": "counter", "name_en": "Counter", "name_np": "काउन्टर", "is_active": True, "created_at": datetime.now(timezone.utc)}
    ]

async def initialize_database():
    print("Checking database...")
    
    # Check categories
    cat_count = await db.categories.count_documents({})
    print(f"Existing categories: {cat_count}")
    
    if cat_count == 0:
        print("Inserting default categories...")
        await db.categories.insert_many(get_default_categories())
        print("✅ Categories initialized!")
    else:
        print("⚠️  Categories already exist. Delete them first if you want to reinitialize.")
    
    # Check locations
    loc_count = await db.locations.count_documents({})
    print(f"Existing locations: {loc_count}")
    
    if loc_count == 0:
        print("Inserting default locations...")
        await db.locations.insert_many(get_default_locations())
        print("✅ Locations initialized!")
    else:
        print("⚠️  Locations already exist. Delete them first if you want to reinitialize.")
    
    # Summary
    print("\n=== Database Summary ===")
    cat_count = await db.categories.count_documents({})
    loc_count = await db.locations.count_documents({})
    print(f"Total categories: {cat_count}")
    print(f"Total locations: {loc_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(initialize_database())
