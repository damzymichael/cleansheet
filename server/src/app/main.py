import logging
import uvicorn

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import text

from app.core.database import engine
from app.core.redis import redis_client
from app.routers.users import router as UsersRouter
from app.routers.auth import router as AuthRouter
from app.routers.items import router as ItemsRouter
from app.routers.business import router as BusinessRouter

# Configure standard logging format for application loggers
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Ensure redis connectivity before startup
    await redis_client.ping()
    logger.info("Redis connected successfully")

    # Ensure database connectivity before startup
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
    logger.info("Database connected successfully")

    yield
    # Shutdown database engine
    await engine.dispose()
    logger.info("Database connection closed")

    # Close redis connection
    await redis_client.aclose()
    logger.info("Redis connection closed")


from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(title="Cleansheet API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# TODO Change Logo in html
HOME_ROUTE_DISPLAY_HTML = """
<div style="background: blue; width: 100vw; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh"> 
  <svg width="100" height="75" viewBox="0 0 100 75" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 37.4999C0 16.7892 16.7893 0 37.4999 0H71.0523C72.5057 0 73.6839 1.17819 73.6839 2.63157V14.2543C73.6839 18.1905 70.493 21.3815 66.5568 21.3815H42.3682C38.2261 21.3815 34.8683 24.7393 34.8683 28.8815V44.8025C34.8683 48.9446 38.2261 52.3024 42.3683 52.3024H66.184C70.3261 52.3024 73.6839 55.6603 73.6839 59.8024V72.3681C73.6839 73.8215 72.5057 74.9997 71.0523 74.9997H37.4999C16.7893 74.9997 0 58.2105 0 37.4999Z" fill="white"/>
    <rect x="77.6328" width="22.3683" height="22.3683" rx="7.49997" fill="white"/>
    <path d="M77.6325 25H92.5008C96.6429 25 100.001 28.3579 100.001 32.5V67.4998C100.001 71.6419 96.6429 74.9998 92.5008 74.9998H85.1324C80.9903 74.9998 77.6325 71.6419 77.6325 67.4998V55.5262C77.6325 51.3841 74.2746 48.0262 70.1325 48.0262H45.6589C41.5168 48.0262 38.1589 44.6684 38.1589 40.5263V32.5C38.1589 28.3578 41.5168 25 45.6589 25H77.6325Z" fill="white"/>
  </svg>
  <h1 style="font-size: 72px; color: white;">CLEANSHEET API</h1>
</div>
<script>
  document.body.style.margin = 0
</script>
"""


# 1. Override standard HTTP Exceptions
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail, "errors": None},
    )


# 2. Override Pydantic Validation Errors (e.g., missing fields)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation Error",
            # exc.errors() returns a list of dictionaries with details about what failed
            "errors": exc.errors(),
        },
    )


# 3. Catch-all for Internal Server Errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An unexpected error occurred. Please try again later.",
            "errors": None,
        },
    )


@app.get("/", response_class=HTMLResponse)
async def home():
    return HOME_ROUTE_DISPLAY_HTML


app.include_router(UsersRouter, prefix="/api")
app.include_router(AuthRouter, prefix="/api")
app.include_router(ItemsRouter, prefix="/api")
app.include_router(BusinessRouter, prefix="/api")


def main():
    """Entry point invoked by `uv run cleansheeet-api`."""
    uvicorn.run(
        "app.main:app", host="127.0.0.1", port=8000, reload=True, log_level="info"
    )


if __name__ == "__main__":
    main()
