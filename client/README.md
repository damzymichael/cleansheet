# React + TypeScript + Vite
# Cleansheet Client

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.
The frontend application for the Cleansheet dry cleaning management suite. Built with a modern React stack focusing on performance, accessibility, and type safety.

Currently, two official plugins are available:
## 🛠️ Tech Stack

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) (TypeScript)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (Radix UI / Lucide React)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Features:** PWA support (`vite-plugin-pwa`), PDF generation (`jspdf`), Error tracking (`@sentry/react`)

## React Compiler
## 🚀 Getting Started

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).
### Prerequisites
- Node.js (v18 or higher recommended)
- npm

## Expanding the ESLint configuration
### Installation

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:
```bash
# Install dependencies
npm install
```

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
### Development

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```bash
# Start the Vite development server
npm run dev
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:
The app will be available at `http://localhost:5173` (or the port Vite outputs).

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'
### Building for Production

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```bash
# Type check and build the application
npm run build

# Preview the production build locally
npm run preview
```

### Linting
```bash
npm run lint
```
