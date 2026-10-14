# RecruitFlow

RecruitFlow is a React application built with Vite, TypeScript, and Tailwind CSS.

## Requirements

- Node.js 22 (the version configured in `.mise.toml`)
- corepack pnpmcorepack pnpm

If pnpm is not installed separately, you can run it through Corepack with `corepack pnpm`.

## Run locally

From the project folder, install dependencies and start the development server:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open the local URL printed by Vite in your browser. By default, it is `http://localhost:5173`. To use port 8443 instead:

```powershell
corepack pnpm dev -- --host 127.0.0.1 --port 8443
```

Stop the server with **Ctrl+C**.

## Other commands

```powershell
corepack pnpm build    # Build the production files into dist/
corepack pnpm preview  # Preview the production build locally
corepack pnpm format   # Format files with oxfmt
```

## Deploy to Figma Make

After installing and configuring the Figma Make CLI, build the project and deploy the generated `dist/` directory:

```powershell
corepack pnpm run build
figma make deploy --build-dir dist
```
