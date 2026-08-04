/**
 * Signup spam guards: email validation, honeypot detection and simple rate limiting.
 *
 * Save as: server/spamGuard.ts
 */

import { promises as dns } from "node:dns";

/* ------------------------------------------------------------------ *
 * 1. Email syntax
 * ------------------------------------------------------------------ */

/**
 * Stricter than the usual `x@y.z` check: requires a sane local part, a real
 * domain label structure and an alphabetic TLD of 2–24 characters.
 */
const EMAIL_RE =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,24}$/i;

export function isSyntacticallyValidEmail(email: string): boolean {
  const value = email.trim();
  if (value.length < 6 || value.length > 254) return false;
  const [local = "", domain = ""] = value.split("@");
  if (local.length > 64 || domain.length > 253) return false;
  if (value.includes("..")) return false;
  return EMAIL_RE.test(value);
}

/* ------------------------------------------------------------------ *
 * 2. Domain blocklist (disposable / throwaway providers)
 * ------------------------------------------------------------------ */

const DISPOSABLE_DOMAINS = new Set(
  (process.env.BLOCKED_EMAIL_DOMAINS || "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
    .concat([
      "mailinator.com",
      "guerrillamail.com",
      "10minutemail.com",
      "tempmail.com",
      "temp-mail.org",
      "throwawaymail.com",
      "yopmail.com",
      "sharklasers.com",
      "trashmail.com",
      "getnada.com",
      "dropmail.me",
      "maildrop.cc",
      "fakeinbox.com",
      "mailnesia.com",
      "spam4.me",
    ]),
);

export function isDisposableDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return DISPOSABLE_DOMAINS.has(domain);
}

/* ------------------------------------------------------------------ *
 * 3. Deliverability (MX lookup)
 * ------------------------------------------------------------------ */

const mxCache = new Map<string, { ok: boolean; at: number }>();
const MX_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const MX_TIMEOUT_MS = Number(process.env.EMAIL_MX_TIMEOUT_MS || 2500);

/**
 * Returns false only when the domain definitively cannot receive mail
 * (no such domain, or no MX/A records). Network problems fail **open** so a
 * DNS hiccup never blocks a real subscriber.
 */
export async function domainCanReceiveMail(email: string): Promise<boolean> {
  if (process.env.SKIP_MX_CHECK === "1") return true;

  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  const cached = mxCache.get(domain);
  if (cached && Date.now() - cached.at < MX_CACHE_TTL_MS) return cached.ok;

  const remember = (ok: boolean) => {
    mxCache.set(domain, { ok, at: Date.now() });
    return ok;
  };

  const timeout = new Promise<"timeout">((resolve) =>
    setTimeout(() => resolve("timeout"), MX_TIMEOUT_MS),
  );

  try {
    const lookup = (async () => {
      const mx = await dns.resolveMx(domain).catch(() => []);
      if (mx.length > 0) return true;
      // Some domains accept mail on their A record with no MX.
      const a = await dns.resolve4(domain).catch(() => []);
      return a.length > 0;
    })();

    const result = await Promise.race([lookup, timeout]);
    if (result === "timeout") return true; // fail open, do not cache
    return remember(result);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    // Domain does not exist at all — safe to reject.
    if (code === "ENOTFOUND" || code === "NXDOMAIN") return remember(false);
    return true; // any other DNS failure: fail open
  }
}

/* ------------------------------------------------------------------ *
 * 4. Honeypot
 * ------------------------------------------------------------------ */

/**
 * The form renders a hidden field that humans never see. Anything filled in
 * means a bot walked the DOM and completed every input it found.
 */
export function looksLikeBotSubmission(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;

  const honeypot = String(b.website ?? b.company ?? "").trim();
  if (honeypot.length > 0) return true;

  // Form was submitted implausibly fast after render.
  const renderedAt = Number(b.formRenderedAt ?? 0);
  if (renderedAt > 0) {
    const elapsed = Date.now() - renderedAt;
    if (elapsed >= 0 && elapsed < 1500) return true;
  }

  return false;
}

/* ------------------------------------------------------------------ *
 * 5. Rate limiting
 * ------------------------------------------------------------------ */

const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

/**
 * In-memory sliding-window limiter.
 *
 * NOTE: on serverless (Vercel) each instance keeps its own counters, so this
 * slows bots rather than stopping them outright. It is still worth having;
 * for a hard limit put Cloudflare or Vercel WAF rules in front of /api.
 */
export function withinRateLimit(
  key: string,
  max = Number(process.env.SIGNUP_RATE_MAX || 5),
  windowMs = Number(process.env.SIGNUP_RATE_WINDOW_MS || 60 * 60 * 1000),
): boolean {
  const now = Date.now();

  if (now - lastSweep > 10 * 60 * 1000) {
    for (const [k, times] of buckets) {
      const kept = times.filter((t) => now - t < windowMs);
      if (kept.length === 0) buckets.delete(k);
      else buckets.set(k, kept);
    }
    lastSweep = now;
  }

  const times = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (times.length >= max) {
    buckets.set(key, times);
    return false;
  }

  times.push(now);
  buckets.set(key, times);
  return true;
}

/** Client IP behind Vercel's proxy. */
export function clientIpFrom(headers: Record<string, unknown>, fallback = ""): string {
  const forwarded = String(headers["x-forwarded-for"] ?? "");
  const first = forwarded.split(",")[0]?.trim();
  return first || String(headers["x-real-ip"] ?? "") || fallback || "unknown";
}

/* ------------------------------------------------------------------ *
 * 6. One-call convenience wrapper
 * ------------------------------------------------------------------ */

export type SignupCheck =
  | { ok: true; email: string }
  | { ok: false; status: number; reason: string };

export async function checkSignupRequest(
  rawEmail: unknown,
  body: unknown,
  ip: string,
): Promise<SignupCheck> {
  const email = String(rawEmail ?? "").trim().toLowerCase();

  if (!email) return { ok: false, status: 400, reason: "missing_email" };

  // Silently accept bot submissions so the bot does not learn it was caught.
  if (looksLikeBotSubmission(body)) {
    return { ok: false, status: 200, reason: "honeypot" };
  }

  if (!isSyntacticallyValidEmail(email)) {
    return { ok: false, status: 400, reason: "invalid_email" };
  }

  if (isDisposableDomain(email)) {
    return { ok: false, status: 400, reason: "disposable_email" };
  }

  if (!withinRateLimit(`signup:${ip}`)) {
    return { ok: false, status: 429, reason: "too_many_requests" };
  }

  if (!(await domainCanReceiveMail(email))) {
    return { ok: false, status: 400, reason: "undeliverable_domain" };
  }

  return { ok: true, email };
}
