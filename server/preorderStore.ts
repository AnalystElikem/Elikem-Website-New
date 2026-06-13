import { makeERPNextRequest } from "./erpnextAuth.js";

/**
 * Website pre-order form → ERPNext **Pre-Order** (or custom) DocType.
 *
 * Env overrides:
 * - `ERPNEXT_PREORDER_DOCTYPE` (default `Pre-Order`)
 * - `ERPNEXT_PREORDER_BOOK_FIELD` — Link / Data field for Books doc name (default `book`)
 * - `ERPNEXT_PREORDER_EMAIL_FIELD` (default `email`)
 * - `ERPNEXT_PREORDER_NAMING_SERIES` — if your doctype uses naming series
 * - `ERPNEXT_PREORDER_RESPECT_PERMISSIONS=1` — omit `ignore_permissions` on POST
 */
const DOCTYPE = (process.env.ERPNEXT_PREORDER_DOCTYPE || "Pre-Order").trim();
const FIELD_BOOK = (process.env.ERPNEXT_PREORDER_BOOK_FIELD || "book").trim();
const FIELD_EMAIL = (process.env.ERPNEXT_PREORDER_EMAIL_FIELD || "email").trim();
const NAMING_SERIES = process.env.ERPNEXT_PREORDER_NAMING_SERIES?.trim();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export async function submitBookPreorder(
  booksDocName: string,
  emailRaw: string
): Promise<{ docName: string }> {
  const book = booksDocName.trim();
  const email = normalizeEmail(emailRaw);

  if (!book) throw new Error("missing_book");
  if (!email) throw new Error("missing_email");
  if (!EMAIL_RE.test(email)) throw new Error("invalid_email");

  const body: Record<string, unknown> = {
    docstatus: 0,
    [FIELD_BOOK]: book,
    [FIELD_EMAIL]: email,
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

  return { docName };
}
