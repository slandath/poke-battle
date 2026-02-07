# Pokemon Battle Tool

A simple tool to create optimal pokemon match-ups.

## How It Works

- Search for your opponent's pokemon
- Card will display:
  - Pokemon's type(s)
  - Types to which it is weak, resistant and immune

## Getting Started

### Using Dev Containers (Recommended)

This project includes a dev container configuration for consistent development environments.

**Prerequisites:**

- Docker installed and running
- VS Code with the "Dev Containers" extension

**Setup:**

1. Open the project in VS Code
2. If not automatically prompted, press `Cmd+Shift+P` (or `Ctrl+Shift+P` on Windows)
3. Select **"Dev Containers: Reopen in Container"**
4. Wait for the container to build and dependencies to install
5. The dev container will automatically forward port 5173 to your local machine

**Running the Development Server:**

Once inside the dev container:

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

**Note:** The Vite configuration includes `host: true` to ensure the dev server works correctly with dev container port forwarding.

### Local Development (Alternative)

If you prefer not to use dev containers:

**Prerequisites:**

- Node.js 24.x
- pnpm 8.x or higher

**Setup:**

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Powered By

[![ESLint](https://img.shields.io/badge/ESLint-4B3A8C?logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Prettier-F7B93E?logo=prettier&logoColor=black)](https://prettier.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vue](https://img.shields.io/badge/Vue-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)

- [Antfu's ESLint Config](https://github.com/antfu/eslint-config)
