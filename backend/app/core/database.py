from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

def _build_connect_args():
    url = settings.DATABASE_URL
    if "sqlite" in url:
        return {"check_same_thread": False}
    # Supabase pooler (transaction mode, port 6543) requires prepared statements disabled
    if "pooler.supabase.com" in url or "6543" in url:
        return {"statement_cache_size": 0}
    return {}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args=_build_connect_args()
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
