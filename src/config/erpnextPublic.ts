/**
 * Public origin for resolving absolute URLs from relative image paths (e.g. blog covers).
 * Set `VITE_ERPNEXT_PUBLIC_URL` in `.env` with no trailing slash.
 */
const raw = (import.meta.env.VITE_ERPNEXT_PUBLIC_URL as string | undefined)?.trim();

export const erpnextPublicOrigin = raw ? raw.replace(/\/$/, "") : "";
