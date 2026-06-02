/**
 * Single source of truth for the backend base URL.
 *
 * Default: a same-origin path (`/api/backend`) that the Next.js rewrite in
 * `next.config.mjs` proxies to the backend. This means the browser only ever
 * talks to the frontend's port, so the whole app runs behind a single
 * published port (3000) — one `docker run`, no exposed API port.
 *
 * Override with `NEXT_PUBLIC_BACKEND_URL` to hit the API directly (e.g. when
 * frontend and backend live on different hosts).
 */
export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "/api/backend"
