# RecruitFlow

RecruitFlow is a React application built with Vite, TypeScript, and Tailwind CSS.

## Requirements

- Node.js 22 (the version configured in `.mise.toml`)
- pnpm 10.34.3 (available through Corepack)

If pnpm is not installed separately, run it through Corepack with `corepack pnpm`.

## Run locally

From the project folder, install dependencies and start the development server:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Open the local URL printed by Vite in your browser. The project uses port 8443 by default. If that port is already in use, choose another port in PowerShell:

```powershell
$env:PORT = "8444"
corepack pnpm dev
```

Stop the server with **Ctrl+C**.

## Other commands

```powershell
corepack pnpm build    # Build the production files into dist/
corepack pnpm preview  # Preview the production build locally
corepack pnpm format   # Format files with oxfmt
```

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds the app and deploys it to GitHub Pages whenever changes are pushed to `main`.

1. Push the project to a GitHub repository.
2. In the repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab). The deployment URL appears in the workflow run and **Settings → Pages**.

The workflow installs the locked pnpm dependencies and builds with the repository-specific base path required by GitHub Pages. Local development and Figma Make builds keep their existing base paths.

## Deploy to Figma Make

After installing and configuring the Figma Make CLI, build the project and deploy the generated `dist/` directory:

```powershell
corepack pnpm run build
figma make deploy --build-dir dist
```
