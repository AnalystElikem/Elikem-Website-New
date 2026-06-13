import { makeERPNextRequest } from "./erpnextAuth.js";
import { isEmailSubscribed, subscribeEmailToNewsletter } from "./newsletterStore.js";

/**
 * Website pre-order form → ERPNext **Pre-Order** (or custom) DocType.
 *
 * Env overrides:
 * - `ERPNEXT_PREORDER_DOCTYPE` (default `Pre-Order`)
 * - `ERPNEXT_PREORDER_BOOK_FIELD` — Link / Data field for Books doc name (default `book`)
 * - `ERPNEXT_PREORDER_EMAIL_FIELD` (default `email`)
 * - `ERPNEXT_PREORDER_FULL_NAME_FIELD` (default `full_name`)
 * - `ERPNEXT_PREORDER_QUANTITY_FIELD` (default `quantity`) — Int / numeric in ERPNext
 * - `ERPNEXT_PREORDER_PHONE_FIELD` (default `phone_number`) — Data / Phone
 * - `ERPNEXT_PREORDER_NAMING_SERIES` — if your doctype uses naming series
 * - `ERPNEXT_PREORDER_RESPECT_PERMISSIONS=1` — omit `ignore_permissions` on POST
 *
 * After a successful Pre-Order insert, the submitter’s **email** is added to **Subscribers**
 * (newsletter) if not already present — same best-effort pattern as the free book gift flow;
 * failures are logged and do not fail the pre-order response.
 */
const DOCTYPE = (process.env.ERPNEXT_PREORDER_DOCTYPE || "Pre-Order").trim();
const FIELD_BOOK = (process.env.ERPNEXT_PREORDER_BOOK_FIELD || "book").trim();
const FIELD_EMAIL = (process.env.ERPNEXT_PREORDER_EMAIL_FIELD || "email").trim();
const FIELD_FULL_NAME = (
  process.env.ERPNEXT_PREORDER_FULL_NAME_FIELD || "full_name"
).trim();
const FIELD_QUANTITY = (
  process.env.ERPNEXT_PREORDER_QUANTITY_FIELD || "quantity"
).trim();
const FIELD_PHONE = (
  process.env.ERPNEXT_PREORDER_PHONE_FIELD || "phone_number"
).trim();
const NAMING_SERIES = process.env.ERPNEXT_PREORDER_NAMING_SERIES?.trim();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Lenient international-style phone (digits + common separators). */
const PHONE_RE = /^[\d\s\-+().]{7,40}$/;

function extractCreatedName(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const o = result as Record<string, unknown>;
  if (o.data != null && typeof o.data === "object") {
    const n = (o.data as Record<string, unknown>).name;
    if (typeof n === "string" && n.trim()) return n.trim();
  }
  if (typeof o.name === "string" && o.name.trim()) return o.name.trim();
  return "";
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const FULL_NAME_MAX = 200;
const PHONE_MAX = 40;
const QTY_MIN = 1;
const QTY_MAX = 999;

export async function submitBookPreorder(
  booksDocName: string,
  emailRaw: string,
  fullNameRaw: string,
  phoneRaw: string,
  quantityRaw: unknown
): Promise<{ docName: string }> {
  const book = booksDocName.trim();
  const email = normalizeEmail(emailRaw);
  const fullName = fullNameRaw.trim().replace(/\s+/g, " ");
  const phone = phoneRaw.trim().replace(/\s+/g, " ");

  if (!book) throw new Error("missing_book");
  if (!email) throw new Error("missing_email");
  if (!EMAIL_RE.test(email)) throw new Error("invalid_email");
  if (!fullName) throw new Error("missing_full_name");
  if (fullName.length > FULL_NAME_MAX) throw new Error("full_name_too_long");
  if (!phone) throw new Error("missing_phone");
  if (phone.length > PHONE_MAX) throw new Error("phone_too_long");
  if (!PHONE_RE.test(phone)) throw new Error("invalid_phone");

  let quantity = NaN;
  if (typeof quantityRaw === "number" && Number.isFinite(quantityRaw)) {
    quantity = Math.trunc(quantityRaw);
  } else if (typeof quantityRaw === "string" && quantityRaw.trim() !== "") {
    quantity = Math.trunc(Number.parseInt(quantityRaw.trim(), 10));
  } else if (quantityRaw != null && quantityRaw !== "") {
    const s = String(quantityRaw).trim();
    if (s) quantity = Math.trunc(Number.parseInt(s, 10));
  }
  if (!Number.isFinite(quantity) || quantity < QTY_MIN || quantity > QTY_MAX) {
    throw new Error("invalid_quantity");
  }

  const body: Record<string, unknown> = {
    docstatus: 0,
    [FIELD_BOOK]: book,
    [FIELD_EMAIL]: email,
    [FIELD_FULL_NAME]: fullName,
    [FIELD_PHONE]: phone,
    [FIELD_QUANTITY]: quantity,
  };

  if (NAMING_SERIES) {
    body.naming_series = NAMING_SERIES;
  }

  const respectPerms = process.env.ERPNEXT_PREORDER_RESPECT_PERMISSIONS === "1";
  const path = `/${encodeURIComponent(DOCTYPE)}${
    respectPerms ? "" : "?ignore_permissions=1"
  }`;

  const result = await makeERPNextRequest(path, {
    method: "POST",
    body,
  });

  const docName = extractCreatedName(result);
  if (!docName) {
    console.error(
      "[preorderStore] Pre-Order create returned no name; raw (truncated):",
      JSON.stringify(result).slice(0, 800)
    );
    throw new Error("erpnext_create_no_name");
  }

  try {
    const alreadySubscribed = await isEmailSubscribed(email);
    if (alreadySubscribed) {
      console.log(
        "[preorderStore] Newsletter: email already on subscriber list, skip add",
      );
    } else {
      await subscribeEmailToNewsletter(email);
      console.log(
        "[preorderStore] Newsletter: ensured Subscribers row after pre-order",
      );
    }
  } catch (err) {
    console.warn(
      "[preorderStore] Newsletter subscribe after Pre-Order failed:",
      err,
    );
  }

  return { docName };
}
