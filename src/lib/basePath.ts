// Optional secret URL prefix for the admin panel.
// Set VITE_ADMIN_PATH in .env (e.g. VITE_ADMIN_PATH=ema-x7k2-panel) at build
// time and the entire app — including /login — is served under /ema-x7k2-panel/.
// Visitors hitting /login or /dashboard directly get a 404 from the host.
const raw = (import.meta.env.VITE_ADMIN_PATH as string | undefined) ?? ''
const clean = raw.replace(/^\/+|\/+$/g, '')

/** Basename for BrowserRouter — '/' when no secret path is configured. */
export const ADMIN_BASE = clean ? `/${clean}` : '/'
