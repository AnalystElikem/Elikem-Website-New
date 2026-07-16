import { makeERPNextRequest } from "./erpnextAuth.js";
import { getLatestBooksFooterEntry } from "./booksStore.js";
import { subscribeEmailToNewsletter } from "./newsletterStore.js";

const DOCTYPE = (process.env.ERPNEXT_BOOK_GIFT_DOCTYPE || "Book Gift").trim();
/**
 * PDF / file URL field (**Data / Small Text / Attach**, not Link).
 * Override: `ERPNEXT_BOOK_GIFT_BOOK_LINK_FIELD` (default `book_link`).
 */
const FIELD_BOOK_LINK =
  (process.env.ERPNEXT_BOOK_GIFT_BOOK_LINK_FIELD || "book_link").trim();
/**
 * **Link** to the **Books** DocType (label *Book Name* → `book_name`).
 * Must receive the Books document `name` (e.g. `cbdi2kd5g4`), never the display title.
 * Override: `ERPNEXT_BOOK_GIFT_BOOK_NAME_FIELD`.
 */
const FIELD_BOOK_NAME =
  (process.env.ERPNEXT_BOOK_GIFT_BOOK_NAME_FIELD || "book_name").trim();
/**
 * Optional second URL field. If set and different from `FIELD_BOOK_LINK`, the PDF goes here
 * and `FIELD_BOOK_LINK` is unused for the PDF (Link book name still uses `FIELD_BOOK_NAME`).
 */
const FIELD_BOOK_PDF_URL =
  process.env.ERPNEXT_BOOK_GIFT_BOOK_PDF_URL_FIELD?.trim() || "";
const FIELD_EMAIL =
  (process.env.ERPNEXT_BOOK_GIFT_EMAIL_FIELD || "email").trim();
/** If your Book Gift autoname uses naming_series, set e.g. `BG-.####` */
const NAMING_SERIES = process.env.ERPNEXT_BOOK_GIFT_NAMING_SERIES?.trim();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Spaces in `/files/...` URLs can confuse tools; keep a single storable URL string. */
function normalizePdfUrlForErp(url: string): string {
  return url.trim().replace(/ /g, "%20");
}

/** Frappe `/api/resource` POST usually returns `{ data: { name, ... } }`; some paths return `{ name }`. */
function extractCreatedDocName(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const o = result as Record<string, unknown>;
  if (o.data != null && typeof o.data === "object") {
    const n = (o.data as Record<string, unknown>).name;
    if (typeof n === "string" && n.trim()) return n.trim();
  }
  if (typeof o.name === "string" && o.name.trim()) return o.name.trim();
  return "";
}

/**
 * Create a **Book Gift** row (Books Link + PDF URL + email) for the current featured Books doc,
 * then add the address to the newsletter list (best-effort).
 */
export async function submitFreeGiftSignup(
  email: string
): Promise<{ giftName: string }> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new Error("missing_email");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("invalid_email");
  }

  const book = await getLatestBooksFooterEntry();
  if (!book?.id) {
    throw new Error("no_book");
  }

  const bookPdfUrl = normalizePdfUrlForErp(book.bookUrl ?? "");
  if (!bookPdfUrl) {
    throw new Error("no_book_pdf");
  }

  const body: Record<string, unknown> = {
    docstatus: 0,
    [FIELD_EMAIL]: normalized,
  };
  if (NAMING_SERIES) {
    body.naming_series = NAMING_SERIES;
  }

  // Link field → Books document name (not display title like "Build")
  if (FIELD_BOOK_NAME) {
    body[FIELD_BOOK_NAME] = book.id;
  }

  const pdfField =
    FIELD_BOOK_PDF_URL && FIELD_BOOK_PDF_URL !== FIELD_BOOK_LINK
      ? FIELD_BOOK_PDF_URL
      : FIELD_BOOK_LINK;
  if (pdfField && pdfField !== FIELD_BOOK_NAME) {
    body[pdfField] = bookPdfUrl;
  }

  console.log("[bookGiftStore] Book Gift POST fields:", {
    bookNameField: FIELD_BOOK_NAME,
    bookNameValue: `(Books Link) ${book.id}`,
    bookDisplayTitle: book.bookName || "(empty)",
    pdfField,
    pdfUrlPreview: `${bookPdfUrl.slice(0, 72)}${bookPdfUrl.length > 72 ? "…" : ""}`,
  });

  const result = await makeERPNextRequest(`/${encodeURIComponent(DOCTYPE)}`, {
    method: "POST",
    body,
  });

  const giftName = extractCreatedDocName(result);

  if (!giftName) {
    console.error(
      "[bookGiftStore] Book Gift create returned no data.name; raw (truncated):",
      JSON.stringify(result).slice(0, 1200)
    );
    throw new Error("erpnext_create_no_name");
  }

  try {
    await subscribeEmailToNewsletter(normalized);
  } catch (err) {
    console.warn("[bookGiftStore] Newsletter subscribe after Book Gift failed:", err);
  }

  return { giftName };
}
