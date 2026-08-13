# Phishing Reporter — Frontend (Web UI)

Standalone React + Vite frontend for the Phishing Website Reporter platform.
Split out from the original monorepo (https://github.com/ekorangin/phising-website-reporter)
so it can be developed, run, and deployed independently from the backend API.

## Requirements

- Node.js v18+
- npm v9+
- The [backend API](../phishing-reporter-backend) running somewhere reachable

## Setup

### Local development (backend running on `localhost:5000`)

```bash
npm install
npm run dev   # http://localhost:5173
```

No `.env` needed for this case — Vite's dev server proxies `/api` and `/screenshots`
requests to `http://localhost:5000` automatically (see `vite.config.js`).

### Pointing at a remote / separately-deployed backend

```bash
cp .env.example .env
# edit .env:
# VITE_API_URL=https://api.example.com
npm run dev
```

### Production build

```bash
cp .env.example .env
# set VITE_API_URL to your deployed backend's public URL
npm run build      # outputs static files to dist/
npm run preview    # optional local preview of the build
```

Deploy the contents of `dist/` to any static host (Vercel, Netlify, S3, Nginx, etc).
Make sure the backend's `CORS_ORIGIN` includes this frontend's public URL.

## Environment variables (`.env`)

| Variable       | Description                                                             | Default                              |
| -------------- | -------------------------------------------------------------------------- | -------------------------------------- |
| `VITE_API_URL` | Public URL of the backend API. Leave empty for local dev (uses Vite proxy). | *(empty — relative requests + proxy)* |

## Project structure

```
phishing-reporter-frontend/
├── src/
│   ├── components/
│   │   ├── AdminDashboard.jsx  # 3-column admin triage console
│   │   ├── PublicForm.jsx      # Public reporting form
│   │   └── StatusModal.jsx     # Deduplication status modal
│   ├── config.js               # API_BASE resolved from VITE_API_URL
│   ├── App.jsx                 # Main navigation & view switcher
│   └── index.css               # Styling & design tokens
├── index.html
├── vite.config.js
├── .env.example
└── package.json
```
