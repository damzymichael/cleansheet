# 🧺 Cleansheet

A modern, high-performance management suite designed for dry cleaning businesses. This repository is a full-stack monorepo featuring a lightning-fast FastAPI backend and a polished, responsive React user interface.

---

## 🏗️ Tech Stack

### Frontend
* **Framework:** [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) (TypeScript)
* **Routing:** [React Router v7](https://reactrouter.com/)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
* **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
* **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

### Backend
* **Server:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.14+)
* **Package Management:** [uv](https://github.com/astral-sh/uv) (Extremely fast Python package installer and resolver)
* **Database:** [PostgreSQL](https://www.postgresql.org/)
* **ORM & Migrations:** [SQLAlchemy 2.0](https://www.sqlalchemy.org/) + [Alembic](https://alembic.sqlalchemy.org/)
* **Caching & Sessions:** [Redis](https://redis.io/)
* **Authentication:** JWT + Session tracking

---

## 📂 Repository Structure

```text
├── client/           # React + Vite frontend
├── server/           # FastAPI backend + SQLAlchemy models
└── README.md         # Project documentation
```

## 🚀 Getting Started

Follow these steps to get the project running locally on your machine.

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/cleansheet.git
cd cleansheet
```

### 2. Backend Setup
The backend handles the business logic, Redis sessions, and PostgreSQL database connections. Ensure you have PostgreSQL and Redis running locally.

```bash
cd server
# Install dependencies using uv
uv sync

# Setup your environment variables
cp .env.example .env
# Edit .env with your PostgreSQL/Redis connection strings

# Initialize your database by running Alembic migrations
uv run alembic upgrade head

# Start the FastAPI server
uv run cleansheet-api
```

### 3. Frontend Setup
The frontend provides the user interface for managing orders, items, and customers.

```bash
cd ../client
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

---

## 📖 API Reference & Documentation

The backend provides a self-documenting API built with OpenAPI standards. Once the FastAPI server is running, you can automatically access:

* **Swagger UI:** `http://127.0.0.1:8000/docs` — An interactive UI to test endpoints.
* **ReDoc:** `http://127.0.0.1:8000/redoc` — Alternative, clean API documentation.
* **OpenAPI Spec:** `http://127.0.0.1:8000/openapi.json` — The raw JSON specification.

---

## ✨ Key Features

* **Order Tracking:** End-to-end lifecycle management of garments from drop-off to ready.
* **Customer CRM:** Store preferences, contact details, and full order history.
* **Secure Authentication:** Robust JWT-based authentication with Redis session management and HTTP-only cookies.
* **Type-Safe API Validation:** Guaranteed data integrity using Pydantic (backend) and Zod (frontend).
* **Modern UI:** A clean, accessible interface built with **shadcn/ui** and **Tailwind CSS**.
* **High-Performance Backend:** Asynchronous Python with FastAPI and PostgreSQL (via asyncpg).