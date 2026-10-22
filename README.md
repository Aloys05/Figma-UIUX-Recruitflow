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

## Visual redesign — supplied reference ZIP

This edition uses **Figma-UIUX-Recruitflow-main** as the functional source and the **RecruitFlow remake UI v2** presentation as the design/asset reference. The project remains React + TypeScript + Vite. The original routes, page headings, mock content, role selection, forms, buttons, tabs, navigation, and existing prototype interactions are retained; the reference ZIP's separate application logic was **not** substituted for them.

### Visual update file map

| Location | Purpose |
|---|---|
| `src/index.css` | Original Figma prototype styles, kept unchanged. |
| `src/premium.css` | New consistent violet/blue gradients, type, premium surfaces, responsive layout refinements, and motion. Edit this file to refine the new look. |
| `src/App.tsx` | Original React components with only targeted presentation changes: branded logo, decorative photographs in job cards/details, public application hero, login imagery, plus route entrance/login visual transitions. |
| `src/main.tsx` | Imports the new `premium.css` after the base styles. |
| `public/assets/` | Logos, office photos, and people photos sourced directly from the design reference ZIP; no external image host required. |
| `public/favicon.png` | Supplied RecruitFlow logo as the browser favicon. |

**Important:** The job companies in the original first ZIP are different from those used in the design reference. Their original names and initials remain unchanged: reference-office photos are used as illustrative photography without mislabeling another company's logo as their own. The branded image on the login and navigation is the supplied RecruitFlow logo.

Animations are entirely visual (CSS staggered entry, progress/chart fills, image reveals, and reduced-motion fallback). Login still opens the same selected role after a short exit effect. No new backend, authentication, persistence, or job-application logic was added: the prototype behaves the way the supplied first ZIP did.

### Fast start on Windows / VS Code

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

Run these from the folder containing `package.json`; follow the localhost URL printed in the terminal. If Corepack cannot `enable` system-wide, you do **not** need to run `corepack enable` again: `corepack pnpm dev` is sufficient. To check the build, run `corepack pnpm build`.


## Screenshot matching update — 19 October 2026

This is a limited design finishing pass on the previous redesigned ZIP:

- **Login (desktop and mobile):** The original cobalt-blue left panel is back with the exact provided team photograph (`public/assets/workplaces/office-2.jpg`), the “People and progress, in one place.” heading, the two floating callouts, the existing RecruitFlow logo, and the “by Refrane” signature. The existing login form, role toggle, submit/navigation and form routes are preserved. Mobile keeps the branded image visible in a compact hero above the sign-in form.
- **Recruiter overview:** An image banner matching the screenshot is inserted above the KPI cards, with the original screenshot heading “Great teams start with thoughtful hiring.” and “Manage campaigns” linking to the existing campaigns route. Uses `public/assets/workplaces/office-1.jpg`.
- **Candidate overview:** The screenshot banner with “Make space for work that feels like you.”, the same picture and the existing jobs-route action replaces the previous readiness hero **only when the displayed profile-readiness percentage is 100**. At other percentages, the original progress card stays in place.
- **Candidate profile readiness:** The summary panel now uses a strong blue gradient with readable white copy, cyan progress ring, and accessible mobile spacing. No profile field or Save button logic was modified.
- **Animations:** Existing entry/transition animations are retained; the new banners enter softly and reveal image/text with small delays, respecting reduced-motion preferences.

### Demonstrating the 100%-ready visual state

**The original React/Figma source is a front-end prototype and does not calculate or persist readiness:** its displayed value is hardcoded at 75%, and its Save changes button does not implement persistence. To avoid changing the requested underlying functionality, this update reads an **optional, presentation-only** value from `localStorage` and otherwise keeps the original 75% value. This is not a new profile-completion engine.

To preview the completed design locally in your browser's DevTools Console, while on the localhost site, run:

```js
localStorage.setItem("recruitflow.profileReadiness", "100");
location.reload();
```

To return to the supplied prototype's 75%-ready state, run:

```js
localStorage.removeItem("recruitflow.profileReadiness");
location.reload();
```

The navigation badge, summary ring, candidate sidebar, and candidate overview banner use the same displayed value. When integrating with a real saved profile-readiness value later, connect it to `getDisplayedProfileReadiness()` in `src/App.tsx`. There were no changes to route names, existing field labels, input behavior, user actions, mock campaigns, job/application data, or sidebar structure.

**Modified files in this finishing pass:** `src/App.tsx`, `src/premium.css`, and this `README.md` only. All other files and assets are copied unchanged from the previous redesign ZIP.

### Demo persistence without a database

The deployed frontend uses browser `localStorage` for demonstration data. Submitted candidate applications are stored under `recruitflow.demoApplications`, so they remain available after refreshes and browser restarts on the same browser and device. Recruiter candidate views read the same entries, allowing the complete application and review flow to be demonstrated without a backend.

This is intentionally local to the browser: data is not shared between users, browsers, or devices, and uploaded files are represented by their filename only. A real deployment should replace these storage helpers with authenticated API requests and server-side file storage.

To reset demo applications from the browser console:

```js
localStorage.removeItem("recruitflow.demoApplications");
location.reload();
```

Generated campaign links include the Vite deployment base path, so the public application URL works correctly for both the local root URL and the GitHub Pages project URL.

Recruiter demo publishing is also stored in `localStorage` under `recruitflow.demoCampaign`. Use the campaign editor's **Publish campaign** button to publish the campaign and activate its candidate URL. Before publishing, the public URL shows an unavailable state; after publishing, candidates can complete the application and the submission appears in the recruiter candidate inbox.
