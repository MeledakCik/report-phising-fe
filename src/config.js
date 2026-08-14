// Base URL of the backend API.
// - In local dev, leave VITE_API_URL unset: Vite's dev proxy (see vite.config.js)
//   forwards /api and /screenshots requests to http://localhost:5000.
// - In production (frontend and backend deployed separately, e.g. Vercel + a VPS),
//   set VITE_API_URL to the backend's public URL, e.g. https://api.example.com
export const API_BASE = import.meta.env.VITE_API_URL || '';
