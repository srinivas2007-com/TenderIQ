import asyncio
from app.core.database import engine, Base
from app.models.models import User, Company, Tender, TenderAnalysis

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables initialized successfully!")

if __name__ == "__main__":
    asyncio.run(main())
