import {
  listERPNextDocuments,
  createERPNextDocument,
} from "./erpnextAuth.js";

const EMAIL_GROUP_NAME =
  (process.env.ERPNEXT_NEWSLETTER_EMAIL_GROUP || "Website Subscribers").trim();
const EMAIL_GROUP_MEMBER_DOCTYPE =
  (process.env.ERPNEXT_EMAIL_GROUP_MEMBER_DOCTYPE || "Email Group Member").trim();

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

async function emailGroupMemberExists(normalized: string): Promise<boolean> {
  const result = await listERPNextDocuments(
    EMAIL_GROUP_MEMBER_DOCTYPE,
    { email_group: EMAIL_GROUP_NAME, email: normalized },
    ["name"],
    { limit: 1 }
  );
  return Array.isArray(result.data) && result.data.length > 0;
}

/**
 * Add the address to the ERPNext **Email Group** (default: Website Subscribers).
 * Runs after the **Subscribers** document is created.
 */
async function addEmailToNewsletterGroup(normalized: string): Promise<void> {
  if (!EMAIL_GROUP_NAME) return;

  if (await emailGroupMemberExists(normalized)) {
    return;
  }

  await createERPNextDocument(EMAIL_GROUP_MEMBER_DOCTYPE, {
    email_group: EMAIL_GROUP_NAME,
    email: normalized,
    docstatus: 0,
  });
}

/**
 * Subscribe an email to the newsletter
 */
export async function subscribeEmailToNewsletter(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  try {
    const alreadySubscribed = await subscriberExistsByEmail(normalized);

    if (!alreadySubscribed) {
      await createERPNextDocument("Subscribers", {
        email: normalized,
        docstatus: 0,
      });
    }

    await addEmailToNewsletterGroup(normalized);

    if (cachedSubscribedEmails) {
      cachedSubscribedEmails.add(normalized);
    } else {
      cachedSubscribedEmails = null;
      cachedAtMs = 0;
    }
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

