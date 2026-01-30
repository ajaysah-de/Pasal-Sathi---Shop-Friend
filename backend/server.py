from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt
import bcrypt
import io
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
SECRET_KEY = os.environ.get('JWT_SECRET', 'pasal-sathi-secret-key-nepal-2024')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

# Security
security = HTTPBearer(auto_error=False)

# Create the main app
app = FastAPI(title="Pasal Sathi API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class ShopConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    shop_name: str = "मेरो पसल"
    shop_name_en: str = "My Shop"
    pin_hash: str  # Legacy - for backward compatibility
    owner_name: str = ""
    phone: str = ""
    address: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    pin_hash: str
    role: str = "cashier"  # owner, manager, cashier
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    pin: str
    role: Optional[str] = "cashier"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    pin: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class PINSetup(BaseModel):
    pin: str
    shop_name: Optional[str] = "मेरो पसल"
    shop_name_en: Optional[str] = "My Shop"

class LoginRequest(BaseModel):
    user_id: str
    pin: str

class PINVerify(BaseModel):
    pin: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    shop_name: str
    shop_name_en: str
    user_name: str
    user_role: str

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_en: str
    name_np: str
    icon: str
    color: str = "#6B7280"
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name_en: str
    name_np: str
    icon: str
    color: Optional[str] = "#6B7280"

class Location(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_en: str
    name_np: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LocationCreate(BaseModel):
    name_en: str
    name_np: str

# Default Product Categories
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

# Kept for backward compatibility
CATEGORIES = [
    {"id": "steel", "name_en": "Steel Utensils", "name_np": "स्टिल भाँडा", "icon": "pot-steaming"},
    {"id": "brass", "name_en": "Brass & Religious", "name_np": "पीतल/पूजा सामान", "icon": "lamp"},
    {"id": "plastic", "name_en": "Plastic Items", "name_np": "प्लास्टिक सामान", "icon": "cup-soda"},
    {"id": "electric", "name_en": "Electric Items", "name_np": "बिजुली सामान", "icon": "zap"},
    {"id": "cleaning", "name_en": "Cleaning Tools", "name_np": "सफाई सामान", "icon": "brush"},
    {"id": "boxed", "name_en": "Boxed Items", "name_np": "बक्स सामान", "icon": "package"},
    {"id": "other", "name_en": "Other Items", "name_np": "अन्य सामान", "icon": "grid-3x3"}
]

# Default Locations
def get_default_locations():
    return [
    {"id": "hanging", "name_en": "Hanging", "name_np": "झुण्डिएको", "is_active": True, "created_at": datetime.now(timezone.utc)},
    {"id": "shelf_top", "name_en": "Top Shelf", "name_np": "माथि शेल्फ", "is_active": True, "created_at": datetime.now(timezone.utc)},
    {"id": "shelf_bottom", "name_en": "Bottom Shelf", "name_np": "तल शेल्फ", "is_active": True, "created_at": datetime.now(timezone.utc)},
    {"id": "front_display", "name_en": "Front Display", "name_np": "अगाडि राखेको", "is_active": True, "created_at": datetime.now(timezone.utc)},
    {"id": "storage", "name_en": "Storage Room", "name_np": "गोदाम", "is_active": True, "created_at": datetime.now(timezone.utc)},
    {"id": "counter", "name_en": "Counter", "name_np": "काउन्टर", "is_active": True, "created_at": datetime.now(timezone.utc)}
]

# Kept for backward compatibility
LOCATIONS = [
    {"id": "hanging", "name_en": "Hanging", "name_np": "झुण्डिएको"},
    {"id": "shelf_top", "name_en": "Top Shelf", "name_np": "माथि शेल्फ"},
    {"id": "shelf_bottom", "name_en": "Bottom Shelf", "name_np": "तल शेल्फ"},
    {"id": "front_display", "name_en": "Front Display", "name_np": "अगाडि राखेको"},
    {"id": "storage", "name_en": "Storage Room", "name_np": "गोदाम"},
    {"id": "counter", "name_en": "Counter", "name_np": "काउन्टर"}
]

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_en: str
    name_np: str = ""
    category: str
    location: str = "shelf_top"
    cost_price: float = 0
    selling_price: float
    quantity: int = 0
    quantity_type: str = "exact"  # exact or approximate
    low_stock_threshold: int = 5
    supplier_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name_en: str
    name_np: Optional[str] = ""
    category: str
    location: Optional[str] = "shelf_top"
    cost_price: Optional[float] = 0
    selling_price: float
    quantity: Optional[int] = 0
    quantity_type: Optional[str] = "exact"
    low_stock_threshold: Optional[int] = 5
    supplier_id: Optional[str] = None

class ProductUpdate(BaseModel):
    name_en: Optional[str] = None
    name_np: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    quantity: Optional[int] = None
    quantity_type: Optional[str] = None
    low_stock_threshold: Optional[int] = None
    supplier_id: Optional[str] = None
    is_active: Optional[bool] = None

class SaleItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    total: float

class Sale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    items: List[SaleItem]
    subtotal: float
    discount: float = 0
    total: float
    payment_type: str  # cash or credit
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None
    user_id: Optional[str] = None  # User who made the sale
    user_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SaleCreate(BaseModel):
    items: List[SaleItem]
    subtotal: float
    discount: Optional[float] = 0
    total: float
    payment_type: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    notes: Optional[str] = None

class Supplier(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str = ""
    address: str = ""
    notes: str = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SupplierCreate(BaseModel):
    name: str
    phone: Optional[str] = ""
    address: Optional[str] = ""
    notes: Optional[str] = ""

class Purchase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    supplier_id: str
    supplier_name: str
    product_id: str
    product_name: str
    quantity: int
    cost_per_unit: float
    total_cost: float
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PurchaseCreate(BaseModel):
    supplier_id: str
    product_id: str
    quantity: int
    cost_per_unit: float
    notes: Optional[str] = ""

# ============ AUTH HELPERS ============

def hash_pin(pin: str) -> str:
    return bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode()

def verify_pin(pin: str, hashed: str) -> bool:
    return bcrypt.checkpw(pin.encode(), hashed.encode())

def create_token(shop_id: str, user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode = {"sub": shop_id, "user_id": user_id, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_shop(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        shop_id = payload.get("sub")
        if shop_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return shop_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id, "is_active": True}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ AUTH ROUTES ============

@api_router.get("/auth/check")
async def check_setup():
    """Check if shop is already set up"""
    config = await db.shop_config.find_one({}, {"_id": 0})
    return {"is_setup": config is not None, "shop_name": config.get("shop_name") if config else None}

@api_router.post("/auth/setup", response_model=TokenResponse)
async def setup_shop(data: PINSetup):
    """Initial shop setup with PIN"""
    existing = await db.shop_config.find_one()
    if existing:
        raise HTTPException(status_code=400, detail="Shop already configured")
    
    if len(data.pin) < 4 or len(data.pin) > 6:
        raise HTTPException(status_code=400, detail="PIN must be 4-6 digits")
    
    config = ShopConfig(
        pin_hash=hash_pin(data.pin),
        shop_name=data.shop_name or "मेरो पसल",
        shop_name_en=data.shop_name_en or "My Shop"
    )
    await db.shop_config.insert_one(config.model_dump())
    
    # Create default owner user
    owner = User(
        name="Owner / मालिक",
        pin_hash=hash_pin(data.pin),
        role="owner"
    )
    await db.users.insert_one(owner.model_dump())
    
    # Initialize default categories and locations
    await db.categories.insert_many(get_default_categories())
    await db.locations.insert_many(get_default_locations())
    
    token = create_token(config.id, owner.id)
    return TokenResponse(
        access_token=token, 
        shop_name=config.shop_name, 
        shop_name_en=config.shop_name_en,
        user_name=owner.name,
        user_role=owner.role
    )

@api_router.get("/auth/users")
async def get_users_for_login():
    """Get list of users for login (without requiring auth)"""
    config = await db.shop_config.find_one({}, {"_id": 0})
    if not config:
        raise HTTPException(status_code=404, detail="Shop not configured")
    
    users = await db.users.find({"is_active": True}, {"_id": 0, "pin_hash": 0}).to_list(50)
    return {"users": users, "shop_name": config["shop_name"]}

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    """Login with user ID and PIN"""
    config = await db.shop_config.find_one({}, {"_id": 0})
    if not config:
        raise HTTPException(status_code=404, detail="Shop not configured")
    
    user = await db.users.find_one({"id": data.user_id, "is_active": True}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_pin(data.pin, user["pin_hash"]):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    token = create_token(config["id"], user["id"])
    return TokenResponse(
        access_token=token, 
        shop_name=config["shop_name"], 
        shop_name_en=config["shop_name_en"],
        user_name=user["name"],
        user_role=user["role"]
    )

@api_router.put("/auth/pin")
async def change_pin(old_pin: str, new_pin: str, user: User = Depends(get_current_user)):
    """Change PIN for current user"""
    if not verify_pin(old_pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="Invalid old PIN")
    
    if len(new_pin) < 4 or len(new_pin) > 6:
        raise HTTPException(status_code=400, detail="PIN must be 4-6 digits")
    
    await db.users.update_one(
        {"id": user.id}, 
        {"$set": {"pin_hash": hash_pin(new_pin)}}
    )
    return {"message": "PIN changed successfully"}

# ============ USER MANAGEMENT ============

@api_router.get("/users", response_model=List[User])
async def get_users(user: User = Depends(get_current_user)):
    """Get all users (only owner/manager can see)"""
    if user.role not in ["owner", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    users = await db.users.find({"is_active": True}, {"_id": 0}).to_list(50)
    return [User(**u) for u in users]

@api_router.post("/users", response_model=User)
async def create_user(data: UserCreate, user: User = Depends(get_current_user)):
    """Create new user (only owner can create)"""
    if user.role != "owner":
        raise HTTPException(status_code=403, detail="Only owner can create users")
    
    if len(data.pin) < 4 or len(data.pin) > 6:
        raise HTTPException(status_code=400, detail="PIN must be 4-6 digits")
    
    new_user = User(
        name=data.name,
        pin_hash=hash_pin(data.pin),
        role=data.role or "cashier"
    )
    await db.users.insert_one(new_user.model_dump())
    return new_user

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, data: UserUpdate, user: User = Depends(get_current_user)):
    """Update user (only owner can update)"""
    if user.role != "owner":
        raise HTTPException(status_code=403, detail="Only owner can update users")
    
    update_data = {}
    if data.name:
        update_data["name"] = data.name
    if data.pin:
        if len(data.pin) < 4 or len(data.pin) > 6:
            raise HTTPException(status_code=400, detail="PIN must be 4-6 digits")
        update_data["pin_hash"] = hash_pin(data.pin)
    if data.role:
        update_data["role"] = data.role
    if data.is_active is not None:
        update_data["is_active"] = data.is_active
    
    result = await db.users.find_one_and_update(
        {"id": user_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    result.pop("_id", None)
    return User(**result)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: User = Depends(get_current_user)):
    """Deactivate user (only owner can delete)"""
    if user.role != "owner":
        raise HTTPException(status_code=403, detail="Only owner can delete users")
    
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    await db.users.update_one({"id": user_id}, {"$set": {"is_active": False}})
    return {"message": "User deactivated"}

# ============ CATEGORIES & LOCATIONS ============

@api_router.post("/categories/initialize")
async def initialize_categories(shop_id: str = Depends(get_current_shop)):
    """Initialize default categories if none exist"""
    count = await db.categories.count_documents({})
    if count == 0:
        await db.categories.insert_many(get_default_categories())
        return {"message": "Default categories initialized", "count": 7}
    return {"message": "Categories already exist", "count": count}

@api_router.get("/categories", response_model=List[Category])
async def get_categories(shop_id: str = Depends(get_current_shop)):
    categories = await db.categories.find({"is_active": True}, {"_id": 0}).sort("name_en", 1).to_list(100)
    # Auto-initialize if empty
    if not categories:
        await db.categories.insert_many(get_default_categories())
        categories = await db.categories.find({"is_active": True}, {"_id": 0}).sort("name_en", 1).to_list(100)
    return [Category(**c) for c in categories]

@api_router.post("/categories", response_model=Category)
async def create_category(data: CategoryCreate, shop_id: str = Depends(get_current_shop)):
    category = Category(**data.model_dump())
    await db.categories.insert_one(category.model_dump())
    return category

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, data: CategoryCreate, shop_id: str = Depends(get_current_shop)):
    update_data = data.model_dump()
    result = await db.categories.find_one_and_update(
        {"id": category_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Category not found")
    result.pop("_id", None)
    return Category(**result)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, shop_id: str = Depends(get_current_shop)):
    # Check if any products use this category
    products_count = await db.products.count_documents({"category": category_id, "is_active": True})
    if products_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete category. {products_count} products are using it.")
    
    await db.categories.update_one({"id": category_id}, {"$set": {"is_active": False}})
    return {"message": "Category deleted"}

@api_router.post("/locations/initialize")
async def initialize_locations(shop_id: str = Depends(get_current_shop)):
    """Initialize default locations if none exist"""
    count = await db.locations.count_documents({})
    if count == 0:
        await db.locations.insert_many(get_default_locations())
        return {"message": "Default locations initialized", "count": 6}
    return {"message": "Locations already exist", "count": count}

@api_router.get("/locations", response_model=List[Location])
async def get_locations(shop_id: str = Depends(get_current_shop)):
    locations = await db.locations.find({"is_active": True}, {"_id": 0}).sort("name_en", 1).to_list(100)
    # Auto-initialize if empty
    if not locations:
        await db.locations.insert_many(get_default_locations())
        locations = await db.locations.find({"is_active": True}, {"_id": 0}).sort("name_en", 1).to_list(100)
    return [Location(**l) for l in locations]

@api_router.post("/locations", response_model=Location)
async def create_location(data: LocationCreate, shop_id: str = Depends(get_current_shop)):
    location = Location(**data.model_dump())
    await db.locations.insert_one(location.model_dump())
    return location

@api_router.put("/locations/{location_id}", response_model=Location)
async def update_location(location_id: str, data: LocationCreate, shop_id: str = Depends(get_current_shop)):
    update_data = data.model_dump()
    result = await db.locations.find_one_and_update(
        {"id": location_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Location not found")
    result.pop("_id", None)
    return Location(**result)

@api_router.delete("/locations/{location_id}")
async def delete_location(location_id: str, shop_id: str = Depends(get_current_shop)):
    # Check if any products use this location
    products_count = await db.products.count_documents({"location": location_id, "is_active": True})
    if products_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete location. {products_count} products are using it.")
    
    await db.locations.update_one({"id": location_id}, {"$set": {"is_active": False}})
    return {"message": "Location deleted"}

# ============ PRODUCTS ============

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, location: Optional[str] = None, search: Optional[str] = None, shop_id: str = Depends(get_current_shop)):
    query = {"is_active": True}
    if category:
        query["category"] = category
    if location:
        query["location"] = location
    if search:
        query["$or"] = [
            {"name_en": {"$regex": search, "$options": "i"}},
            {"name_np": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).sort("name_en", 1).to_list(1000)
    return [Product(**p) for p in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str, shop_id: str = Depends(get_current_shop)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(data: ProductCreate, shop_id: str = Depends(get_current_shop)):
    product = Product(**data.model_dump())
    await db.products.insert_one(product.model_dump())
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, data: ProductUpdate, shop_id: str = Depends(get_current_shop)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.products.find_one_and_update(
        {"id": product_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Product not found")
    
    result.pop("_id", None)
    return Product(**result)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, shop_id: str = Depends(get_current_shop)):
    await db.products.update_one({"id": product_id}, {"$set": {"is_active": False}})
    return {"message": "Product deleted"}

@api_router.put("/products/{product_id}/stock")
async def update_stock(product_id: str, quantity: int, shop_id: str = Depends(get_current_shop)):
    """Quick stock update"""
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"quantity": quantity, "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": "Stock updated"}

# ============ SALES ============

@api_router.get("/sales", response_model=List[Sale])
async def get_sales(date_from: Optional[str] = None, date_to: Optional[str] = None, shop_id: str = Depends(get_current_shop)):
    query = {}
    if date_from:
        query["created_at"] = {"$gte": datetime.fromisoformat(date_from.replace('Z', '+00:00'))}
    if date_to:
        if "created_at" in query:
            query["created_at"]["$lte"] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
        else:
            query["created_at"] = {"$lte": datetime.fromisoformat(date_to.replace('Z', '+00:00'))}
    
    sales = await db.sales.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Sale(**s) for s in sales]

@api_router.get("/sales/today")
async def get_today_sales(shop_id: str = Depends(get_current_shop)):
    """Get today's sales summary"""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    sales = await db.sales.find({"created_at": {"$gte": today_start}}, {"_id": 0}).to_list(1000)
    
    total_sales = sum(s["total"] for s in sales)
    total_cash = sum(s["total"] for s in sales if s["payment_type"] == "cash")
    total_credit = sum(s["total"] for s in sales if s["payment_type"] == "credit")
    
    return {
        "count": len(sales),
        "total": total_sales,
        "cash": total_cash,
        "credit": total_credit,
        "recent": [Sale(**s) for s in sales[:5]]
    }

@api_router.post("/sales", response_model=Sale)
async def create_sale(data: SaleCreate, user: User = Depends(get_current_user)):
    sale = Sale(**data.model_dump(), user_id=user.id, user_name=user.name)
    await db.sales.insert_one(sale.model_dump())
    
    # Update product quantities
    for item in sale.items:
        await db.products.update_one(
            {"id": item.product_id},
            {"$inc": {"quantity": -item.quantity}}
        )
    
    return sale

# ============ SUPPLIERS ============

@api_router.get("/suppliers", response_model=List[Supplier])
async def get_suppliers(shop_id: str = Depends(get_current_shop)):
    suppliers = await db.suppliers.find({"is_active": True}, {"_id": 0}).to_list(100)
    return [Supplier(**s) for s in suppliers]

@api_router.post("/suppliers", response_model=Supplier)
async def create_supplier(data: SupplierCreate, shop_id: str = Depends(get_current_shop)):
    supplier = Supplier(**data.model_dump())
    await db.suppliers.insert_one(supplier.model_dump())
    return supplier

@api_router.put("/suppliers/{supplier_id}", response_model=Supplier)
async def update_supplier(supplier_id: str, data: SupplierCreate, shop_id: str = Depends(get_current_shop)):
    update_data = data.model_dump()
    result = await db.suppliers.find_one_and_update(
        {"id": supplier_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Supplier not found")
    result.pop("_id", None)
    return Supplier(**result)

@api_router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str, shop_id: str = Depends(get_current_shop)):
    await db.suppliers.update_one({"id": supplier_id}, {"$set": {"is_active": False}})
    return {"message": "Supplier deleted"}

# ============ PURCHASES ============

@api_router.get("/purchases", response_model=List[Purchase])
async def get_purchases(supplier_id: Optional[str] = None, shop_id: str = Depends(get_current_shop)):
    query = {}
    if supplier_id:
        query["supplier_id"] = supplier_id
    
    purchases = await db.purchases.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [Purchase(**p) for p in purchases]

@api_router.post("/purchases", response_model=Purchase)
async def create_purchase(data: PurchaseCreate, shop_id: str = Depends(get_current_shop)):
    # Get supplier and product names
    supplier = await db.suppliers.find_one({"id": data.supplier_id}, {"_id": 0})
    product = await db.products.find_one({"id": data.product_id}, {"_id": 0})
    
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    purchase = Purchase(
        supplier_id=data.supplier_id,
        supplier_name=supplier["name"],
        product_id=data.product_id,
        product_name=product["name_en"],
        quantity=data.quantity,
        cost_per_unit=data.cost_per_unit,
        total_cost=data.quantity * data.cost_per_unit,
        notes=data.notes or ""
    )
    await db.purchases.insert_one(purchase.model_dump())
    
    # Update product quantity and cost price
    await db.products.update_one(
        {"id": data.product_id},
        {
            "$inc": {"quantity": data.quantity},
            "$set": {"cost_price": data.cost_per_unit, "updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return purchase

# ============ LOW STOCK ALERTS ============

@api_router.get("/alerts/low-stock")
async def get_low_stock_alerts(shop_id: str = Depends(get_current_shop)):
    """Get products below their low stock threshold"""
    products = await db.products.find(
        {"is_active": True, "$expr": {"$lte": ["$quantity", "$low_stock_threshold"]}},
        {"_id": 0}
    ).to_list(100)
    
    return [Product(**p) for p in products]

# ============ DASHBOARD STATS ============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(shop_id: str = Depends(get_current_shop)):
    """Get dashboard statistics"""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    
    # Today's sales
    today_sales = await db.sales.find({"created_at": {"$gte": today_start}}, {"_id": 0}).to_list(1000)
    today_total = sum(s["total"] for s in today_sales)
    
    # This week's sales
    week_sales = await db.sales.find({"created_at": {"$gte": week_start}}, {"_id": 0}).to_list(1000)
    week_total = sum(s["total"] for s in week_sales)
    
    # Product counts
    total_products = await db.products.count_documents({"is_active": True})
    low_stock_count = await db.products.count_documents({
        "is_active": True,
        "$expr": {"$lte": ["$quantity", "$low_stock_threshold"]}
    })
    
    # Inventory value
    products = await db.products.find({"is_active": True}, {"_id": 0}).to_list(1000)
    inventory_value = sum(p.get("selling_price", 0) * p.get("quantity", 0) for p in products)
    
    return {
        "today_sales": today_total,
        "today_count": len(today_sales),
        "week_sales": week_total,
        "week_count": len(week_sales),
        "total_products": total_products,
        "low_stock_count": low_stock_count,
        "inventory_value": inventory_value
    }

# ============ REPORTS ============

@api_router.get("/reports/sales/excel")
async def export_sales_excel(date_from: str, date_to: str, shop_id: str = Depends(get_current_shop)):
    """Export sales report as Excel"""
    from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
    to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
    
    sales = await db.sales.find({"created_at": {"$gte": from_date, "$lte": to_date}}, {"_id": 0}).to_list(1000)
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Sales Report"
    
    # Header
    ws.append(["Date", "Items", "Payment Type", "Subtotal", "Discount", "Total", "Customer"])
    
    for sale in sales:
        items_str = ", ".join([f"{i['product_name']} x{i['quantity']}" for i in sale["items"]])
        ws.append([
            sale["created_at"].strftime("%Y-%m-%d %H:%M"),
            items_str,
            sale["payment_type"],
            sale["subtotal"],
            sale["discount"],
            sale["total"],
            sale.get("customer_name", "")
        ])
    
    # Save to bytes
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=sales_report_{date_from[:10]}_{date_to[:10]}.xlsx"}
    )

@api_router.get("/reports/inventory/excel")
async def export_inventory_excel(shop_id: str = Depends(get_current_shop)):
    """Export inventory report as Excel"""
    products = await db.products.find({"is_active": True}, {"_id": 0}).to_list(1000)
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Inventory Report"
    
    # Header
    ws.append(["Name (EN)", "Name (NP)", "Category", "Location", "Cost Price", "Selling Price", "Quantity", "Stock Value"])
    
    for p in products:
        ws.append([
            p["name_en"],
            p.get("name_np", ""),
            p["category"],
            p["location"],
            p.get("cost_price", 0),
            p["selling_price"],
            p["quantity"],
            p["selling_price"] * p["quantity"]
        ])
    
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=inventory_report_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )

@api_router.get("/reports/sales/pdf")
async def export_sales_pdf(date_from: str, date_to: str, shop_id: str = Depends(get_current_shop)):
    """Export sales report as PDF"""
    from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
    to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
    
    sales = await db.sales.find({"created_at": {"$gte": from_date, "$lte": to_date}}, {"_id": 0}).to_list(1000)
    
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], alignment=1)
    elements.append(Paragraph("Sales Report / बिक्री रिपोर्ट", title_style))
    elements.append(Paragraph(f"From {date_from[:10]} to {date_to[:10]}", styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Table data
    data = [["Date", "Items", "Type", "Total (Rs.)"]]
    total_sum = 0
    
    for sale in sales:
        items_str = ", ".join([f"{i['product_name']} x{i['quantity']}" for i in sale["items"]])[:50]
        data.append([
            sale["created_at"].strftime("%m/%d %H:%M"),
            items_str,
            sale["payment_type"],
            f"Rs. {sale['total']:.0f}"
        ])
        total_sum += sale["total"]
    
    data.append(["", "", "Total:", f"Rs. {total_sum:.0f}"])
    
    table = Table(data, colWidths=[1.2*inch, 3*inch, 0.8*inch, 1*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.545, 0, 0)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, -1), (-1, -1), colors.Color(0.9, 0.9, 0.9)),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(table)
    
    doc.build(elements)
    output.seek(0)
    
    return Response(
        content=output.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=sales_report_{date_from[:10]}_{date_to[:10]}.pdf"}
    )

# ============ AI INVENTORY SCANNING ============

class ScanImageRequest(BaseModel):
    image_base64: str
    mode: str = "smart"  # "quick" or "smart"

class DetectedItem(BaseModel):
    name: str
    name_np: Optional[str] = None
    category: str
    count: int
    confidence: str  # "high", "medium", "low"
    location_hint: Optional[str] = None

class ScanResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mode: str
    detected_items: List[DetectedItem]
    total_items_counted: int
    scan_notes: str
    matched_products: List[dict] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/scan/analyze", response_model=ScanResult)
async def analyze_inventory_image(data: ScanImageRequest, shop_id: str = Depends(get_current_shop)):
    """Analyze image using GPT-4o to count and identify products"""
    import openai
    import json
    import re
    
    # Support both EMERGENT_LLM_KEY and OPENAI_API_KEY
    api_key = os.environ.get('OPENAI_API_KEY') or os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured. Set OPENAI_API_KEY.")
    
    # Get existing products for matching
    existing_products = await db.products.find({"is_active": True}, {"_id": 0}).to_list(500)
    product_list = [{"name": p["name_en"], "name_np": p.get("name_np", ""), "category": p["category"]} for p in existing_products]
    
    # Build prompt based on mode
    if data.mode == "quick":
        system_prompt = """You are an inventory counting assistant for a Nepali utensil shop.
Your task is to COUNT items visible in the image. Focus on accuracy of counts.

Categories: steel (utensils), brass (religious items like diya, kalash), plastic, electric, cleaning, boxed, other

Respond ONLY in this JSON format:
{
    "items": [
        {"name": "Steel Plate Large", "name_np": "स्टिल थाली ठूलो", "category": "steel", "count": 15, "confidence": "high"},
        {"name": "Brass Diya", "name_np": "पीतल दियो", "category": "brass", "count": 8, "confidence": "medium"}
    ],
    "total_counted": 23,
    "notes": "Counted items on front shelf. Some items partially hidden."
}"""
        user_prompt = "Count all visible products in this shop image. Be accurate with counts."
    else:
        # Smart mode - also try to match with existing inventory
        system_prompt = f"""You are an inventory counting assistant for a Nepali utensil shop.
Your task is to IDENTIFY and COUNT items visible in the image, and match them to existing inventory.

Existing products in shop inventory:
{product_list[:50]}

Categories: steel (utensils), brass (religious items like diya, kalash), plastic, electric, cleaning, boxed, other

Location hints: hanging, shelf_top, shelf_bottom, front_display, storage, counter

Respond ONLY in this JSON format:
{{
    "items": [
        {{"name": "Steel Plate Large", "name_np": "स्टिल थाली ठूलो", "category": "steel", "count": 15, "confidence": "high", "location_hint": "shelf_top", "matches_existing": "Steel Plate Large"}},
        {{"name": "Brass Diya Small", "name_np": "सानो पीतल दियो", "category": "brass", "count": 8, "confidence": "medium", "location_hint": "front_display", "matches_existing": null}}
    ],
    "total_counted": 23,
    "notes": "Identified items on front display. Pressure cooker boxes visible on top shelf."
}}"""
        user_prompt = "Identify and count all visible products. Match them to existing inventory if possible. Note their location in the shop."
    
    try:
        # Use OpenAI SDK directly
        client = openai.OpenAI(api_key=api_key)
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{data.image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=2000
        )
        
        response_text = response.choices[0].message.content
        
        # Extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if not json_match:
            raise HTTPException(status_code=500, detail="Failed to parse AI response")
        
        result_data = json.loads(json_match.group())
        
        # Build detected items
        detected_items = []
        for item in result_data.get("items", []):
            detected_items.append(DetectedItem(
                name=item.get("name", "Unknown"),
                name_np=item.get("name_np"),
                category=item.get("category", "other"),
                count=item.get("count", 0),
                confidence=item.get("confidence", "medium"),
                location_hint=item.get("location_hint")
            ))
        
        # Match with existing products
        matched_products = []
        for item in detected_items:
            # Find best match in existing products
            for product in existing_products:
                if item.name.lower() in product["name_en"].lower() or product["name_en"].lower() in item.name.lower():
                    matched_products.append({
                        "detected_name": item.name,
                        "detected_count": item.count,
                        "product_id": product["id"],
                        "product_name": product["name_en"],
                        "current_stock": product["quantity"],
                        "difference": item.count - product["quantity"]
                    })
                    break
        
        scan_result = ScanResult(
            mode=data.mode,
            detected_items=detected_items,
            total_items_counted=result_data.get("total_counted", sum(i.count for i in detected_items)),
            scan_notes=result_data.get("notes", ""),
            matched_products=matched_products
        )
        
        # Save scan to database
        await db.scans.insert_one(scan_result.model_dump())
        
        return scan_result
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        logger.error(f"Scan error: {e}")
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

@api_router.post("/scan/update-stock")
async def update_stock_from_scan(updates: List[dict], shop_id: str = Depends(get_current_shop)):
    """Update product stock based on scan results"""
    updated = []
    for update in updates:
        product_id = update.get("product_id")
        new_quantity = update.get("new_quantity")
        
        if product_id and new_quantity is not None:
            await db.products.update_one(
                {"id": product_id},
                {"$set": {"quantity": new_quantity, "updated_at": datetime.now(timezone.utc)}}
            )
            updated.append(product_id)
    
    return {"message": f"Updated {len(updated)} products", "updated_ids": updated}

@api_router.get("/scans", response_model=List[ScanResult])
async def get_scan_history(limit: int = 10, shop_id: str = Depends(get_current_shop)):
    """Get recent scan history"""
    scans = await db.scans.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return [ScanResult(**s) for s in scans]

# ============ ROOT ============

@api_router.get("/")
async def root():
    return {"message": "Pasal Sathi API - पसल साथी", "version": "1.1.0"}

# Include router and middleware
app.include_router(api_router)

# CORS configuration - support both environment variable and production URLs
cors_origins = os.environ.get('CORS_ORIGINS', '*')
if cors_origins == '*':
    # Default production origins if not set
    allowed_origins = [
        "https://pasal-sathi-shop-friend.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173"
    ]
else:
    allowed_origins = [origin.strip() for origin in cors_origins.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
