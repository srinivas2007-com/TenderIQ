from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings


def _normalize_url(url: str) -> str:
    """Ensure postgres URLs always use the asyncpg driver."""
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url


def _build_connect_args(url: str) -> dict:
    if "sqlite" in url:
        return {"check_same_thread": False}
    # Supabase pooler (transaction mode, port 6543) requires prepared statements disabled
    if "pooler.supabase.com" in url or ":6543" in url:
        return {"prepared_statement_cache_size": 0}
    return {}


_db_url = _normalize_url(settings.DATABASE_URL)

engine = create_async_engine(
    _db_url,
    echo=False,
    future=True,
    connect_args=_build_connect_args(_db_url)
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
