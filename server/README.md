# Cleansheeet API
# Cleansheet API (Backend)

Use "uv run cleansheet-api" to run the project
The high-performance, asynchronous REST API powering the Cleansheet dry cleaning management suite.

## 🛠️ Tech Stack

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.14+)
- **Package Manager:** [uv](https://github.com/astral-sh/uv)
- **Database:** PostgreSQL (via asyncpg & psycopg)
- **ORM & Migrations:** [SQLAlchemy 2.0](https://docs.sqlalchemy.org/en/20/) + [Alembic](https://alembic.sqlalchemy.org/en/latest/)
- **Caching & Sessions:** [Redis](https://redis.io/)
- **Authentication:** JWT + Session tracking + Argon2 (`pwdlib`)

## 🚀 Getting Started

### Prerequisites
- [uv](https://github.com/astral-sh/uv) installed
- PostgreSQL running locally
- Redis running locally

### Installation

```bash
# Sync and install dependencies via uv
uv sync
```

### Environment Configuration

Create a `.env` file in the `server` directory (you can copy `.env.example`):
```bash
cp .env.example .env
```
Ensure your `DATEBASE_URL` (or `DATABASE_URL`) and `SECRET_KEY` are properly configured to match your local setup.

### Database Migrations

Before running the app, initialize your database schema:
```bash
uv run alembic upgrade head
```

### Development

Start the FastAPI development server:
```bash
uv run cleansheet-api
```
The server will run at `http://127.0.0.1:8000`.

## 📖 API Documentation

Once the server is running, FastAPI automatically generates interactive documentation:
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)