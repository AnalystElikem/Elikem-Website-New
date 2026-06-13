import {
  listERPNextDocuments,
  createERPNextDocument,
} from "./erpnextAuth.js";

let cachedSubscribedEmails: Set<string> | null = null;
let cachedAtMs = 0;

const CACHE_TTL_MS = parseInt(
  process.env.NEWSLETTER_CACHE_TTL_MS || "300000",
  10,
); // default 5 minutes

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Load all subscribed emails from ERPNext Subscribers doctype
 */
async function loadSubscribedEmails(): Promise<Set<string>> {
  try {
    const result = await listERPNextDocuments("Subscribers", {}, ["email"]);

    const emails = new Set<string>();
    if (result.data && Array.isArray(result.data)) {
      for (const subscriber of result.data) {
        const email = (subscriber as any)?.email;
        if (email) {
          emails.add(normalizeEmail(email));
        }
      }
    }

    return emails;
  } catch (error) {
    console.error("Failed to load subscribed emails from ERPNext:", error);
    throw error;
  }
}

/**
 * Check if an email is subscribed
 */
export async function isEmailSubscribed(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  const now = Date.now();
  if (cachedSubscribedEmails && now - cachedAtMs < CACHE_TTL_MS) {
    return cachedSubscribedEmails.has(normalized);
  }

  const emails = await loadSubscribedEmails();
  cachedSubscribedEmails = emails;
  cachedAtMs = now;
  return emails.has(normalized);
}

async function subscriberExistsByEmail(normalized: string): Promise<boolean> {
  const result = await listERPNextDocuments(
    "Subscribers",
    { email: normalized },
    ["name"],
    { limit: 1 }
  );
  return Array.isArray(result.data) && result.data.length > 0;
}

function isLikelyDuplicateSubscriberError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? `${err.name} ${err.message}`
      : typeof err === "string"
        ? err
        : JSON.stringify(err);
  return /DuplicateEntry|duplicate entry|UniqueViolation|already exists|Duplicate/i.test(
    msg,
  );
}

/**
 * Subscribe an email to the newsletter
 */
export async function subscribeEmailToNewsletter(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  try {
    if (await subscriberExistsByEmail(normalized)) {
      if (cachedSubscribedEmails) {
        cachedSubscribedEmails.add(normalized);
      }
      return;
    }

    await createERPNextDocument("Subscribers", {
      email: normalized,
      docstatus: 0,
    });

    cachedSubscribedEmails = null;
    cachedAtMs = 0;
  } catch (error) {
    if (isLikelyDuplicateSubscriberError(error)) {
      cachedSubscribedEmails = null;
      cachedAtMs = 0;
      return;
    }
    console.error("Failed to subscribe email to newsletter:", error);
    throw error;
  }
}

