"""Clear shop_config and users collections for testing"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def clear_collections():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.pasal_sathi
    
    await db.shop_config.drop()
    await db.users.drop()
    
    print("✓ Collections cleared successfully!")
    print("You can now test the multi-user setup from scratch.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_collections())
