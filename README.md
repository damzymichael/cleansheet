# 🧺 DryCleanOS

A modern, high-performance management suite designed for dry cleaning businesses. This repository is a full-stack monorepo featuring a lightning-fast API and a polished, responsive user interface.

---

## 🏗️ Tech Stack

### Frontend
* **Framework:** [Vite](https://vitejs.dev/) + [React](https://react.dev/)
* **Routing:** [React Router](https://reactrouter.com/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **UI Components:** [shadcn/ui](https://ui.shadcn.com/)

### Backend
* **Server:** [Hono](https://hono.dev/) (Ultra-fast web framework)
* **Validation:** [Zod](https://zod.dev/) (First-class type safety)
* **Database:** [SQLite](https://www.sqlite.org/)
* **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
* **Documentation:** [OpenAPI](https://www.openapis.org/) + [Scalar](https://scalar.com/) for visualization

---

## 📂 Repository Structure

```text
├── client/           # React + Vite frontend
├── server/           # Hono backend + Drizzle schema
├── docs/             # Static documentation files
└── package.json      # Root dependencies and scripts
```

## 🚀 Getting Started

Follow these steps to get the project running locally on your machine.

# 1. Clone the Repository

```bash
git clone [https://github.com/yourusername/drycleanos.git](https://github.com/yourusername/drycleanos.git)
cd drycleanos
```

# 2. Backend Setup
The backend handles the business logic and SQLite database connection.

```bash
cd server
npm install
# Initialize your SQLite database and push the schema
npx drizzle-kit push
# Start the Hono server
npm run dev
```

# 3. Frontend Setup
The frontend provides the user interface for managing orders and customers.

```bash
cd ../client
npm install
# Start the Vite development server
npm run dev
```

---

## 📖 API Reference & Documentation

The backend provides a self-documenting API built with OpenAPI standards. Once the server is running, you can access:

* **Interactive Reference:** `/reference` — An interactive UI to test endpoints via **Scalar**.
* **OpenAPI Spec:** `/doc` — The raw JSON/YAML specification.

---

## ✨ Key Features

* **Order Tracking:** End-to-end lifecycle management of garments from drop-off to ready.
* **Customer CRM:** Store preferences, contact details, and full order history.
* **Type-Safe API:** Guaranteed data integrity using Zod schemas for both validation and frontend types.
* **Modern UI:** A clean, accessible interface built with **shadcn/ui** and **Tailwind CSS**.
* **Lightweight DB:** Zero-config **SQLite** database for easy development and local deployment.

---
## 🛠️ Development Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the development environment |
| `npx drizzle-kit studio` | Opens a GUI to view/edit your SQLite database |
| `npm run build` | Compiles the project for production |