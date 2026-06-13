import type { Response as ExpressResponse } from "express";
import {
  listERPNextDocuments,
  getERPNextDocument,
  getERPNextConfig,
  makeERPNextRequest,
} from "./erpnextAuth.js";

/**
 * Latest Books row for the site “free gift” block.
 * Matches ERPNext DocType **Books** fields:
 * - Book Name → `book_name`
 * - Book (file) → `book`
 * - Image → `image`
 * - Description → `description`
 * - `is_free` — free read on site + download when `book` is set
 * - `is_amazon` + `amazon_url` — buy link
 * - `is_preorder` — pre-order form (`/books/preorder/:id`)
 *
 * Doctype name override: `ERPNEXT_BOOKS_DOCTYPE` (default `Books`).
 * If your description field has a custom API name: `ERPNEXT_BOOKS_DESCRIPTION_FIELD`.
 */
export type FooterLatestBook = {
  id: string;
  bookName: string;
  description: string;
  imageUrl: string | null;
  bookUrl: string | null;
  isFree: boolean;
  isAmazon: boolean;
  isPreorder: boolean;
  amazonUrl: string | null;
};

function siteBaseUrl(): string {
  return getERPNextConfig().apiUrl.replace(/\/$/, "");
}

/** ERPNext attach / file paths are usually relative to the site origin */
function resolvePublicUrl(path?: string | null): string | null {
  if (path == null || typeof path !== "string") return null;
  const p = path.trim();
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const base = siteBaseUrl();
  return `${base}${p.startsWith("/") ? p : `/${p}`}`;
}

/** ERPNext Check / Int / Data → boolean */
function truthyFromErp(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    return s === "1" || s === "yes" || s === "true" || s === "y";
  }
  return false;
}

function pickDescription(source: Record<string, unknown>): string {
  const envField = process.env.ERPNEXT_BOOKS_DESCRIPTION_FIELD?.trim();
  if (envField) {
    const v = source[envField];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  const keys = [
    "description",
    "book_description",
    "detail",
    "details",
    "summary",
    "about",
    "synopsis",
    "intro",
  ];
  for (const key of keys) {
    const v = source[key];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  for (const [key, v] of Object.entries(source)) {
    if (/description/i.test(key) && !/^meta_/i.test(key)) {
      const s = String(v ?? "").trim();
      if (s) return s;
    }
  }
  return "";
}

/** GET /resource/Doc/name wraps fields under `data` */
function unwrapDoc<T extends Record<string, unknown>>(res: unknown): T {
  if (res && typeof res === "object" && "data" in res) {
    const d = (res as { data: unknown }).data;
    if (d && typeof d === "object") return d as T;
  }
  return (res as T) ?? ({} as T);
}

/** Full GET `/Books/{name}` — returns all permitted fields (incl. long `description`). */
async function fetchBooksDocRow(
  doctype: string,
  name: string
): Promise<Record<string, unknown>> {
  const res = await makeERPNextRequest(
    `/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`
  );
  return unwrapDoc<Record<string, unknown>>(res);
}

function pickAmazonUrl(merged: Record<string, unknown>): string | null {
  const raw = merged.amazon_url ?? merged.amazon_link;
  if (raw == null || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return resolvePublicUrl(t);
}

function mapMergedRowToFooterBook(merged: Record<string, unknown>): FooterLatestBook | null {
  const id = String(merged.name ?? "").trim();
  if (!id) return null;
  const bookName =
    String(merged.book_name ?? merged.title ?? "").trim() || id || "Book";
  const description = pickDescription(merged);
  const imageUrl = resolvePublicUrl(merged.image as string);
  const bookUrl = resolvePublicUrl(merged.book as string);
  const amazonUrl = pickAmazonUrl(merged);
  return {
    id,
    bookName,
    description,
    imageUrl,
    bookUrl,
    isFree: truthyFromErp(merged.is_free),
    isAmazon: truthyFromErp(merged.is_amazon),
    isPreorder: truthyFromErp(merged.is_preorder),
    amazonUrl,
  };
}

async function mergeBooksDocFromErp(
  doctype: string,
  id: string,
  seed: Record<string, unknown>
): Promise<Record<string, unknown>> {
  let merged: Record<string, unknown> = { ...seed };
  try {
    merged = { ...merged, ...(await fetchBooksDocRow(doctype, id)) };
  } catch (e) {
    console.warn(
      `[booksStore] Books doc fetch failed for ${doctype}/${id}, trying generic GET:`,
      e
    );
    try {
      const fullRes = await getERPNextDocument(doctype, id);
      merged = { ...merged, ...unwrapDoc<Record<string, unknown>>(fullRes) };
    } catch (e2) {
      console.warn(`[booksStore] Fallback GET also failed:`, e2);
    }
  }
  return merged;
}

export async function getLatestBooksFooterEntry(): Promise<FooterLatestBook | null> {
  const doctype = (process.env.ERPNEXT_BOOKS_DOCTYPE || "Books").trim();
  try {
    const result = await listERPNextDocuments(
      doctype,
      {},
      [
        "name",
        "book_name",
        "book",
        "image",
        "modified",
        "is_free",
        "is_amazon",
        "is_preorder",
        "amazon_url",
      ],
      { orderBy: "modified desc", limit: 1 }
    );

    const row = result.data?.[0] as Record<string, unknown> | undefined;
    if (!row) return null;

    const id = String(row.name ?? "").trim();
    if (!id) return null;

    const merged = await mergeBooksDocFromErp(doctype, id, row);
    return mapMergedRowToFooterBook(merged);
  } catch (error) {
    console.error(`[booksStore] Failed to load latest ${doctype}:`, error);
    return null;
  }
}

/**
 * Default columns for `GET /resource/Books?fields=[...]` (catalog).
 * Omit names that are not on your DocType — ERPNext returns **417** if a field is missing
 * or not allowed in list queries. Override entirely with **`ERPNEXT_BOOKS_LIST_FIELDS`**
 * (comma-separated), e.g. `name,book_name,book,image,modified,is_free,is_amazon,is_preorder,amazon_url`
 * if `description` is not list-queryable on your site.
 */
const BOOKS_LIST_FIELDS_DEFAULT = [
  "name",
  "book_name",
  "book",
  "image",
  "modified",
  "description",
  "is_free",
  "is_amazon",
  "is_preorder",
  "amazon_url",
] as const;

function booksListFieldsForCatalog(): string[] {
  const raw = process.env.ERPNEXT_BOOKS_LIST_FIELDS?.trim();
  if (raw) {
    const fields = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (fields.length > 0) return fields;
  }
  return [...BOOKS_LIST_FIELDS_DEFAULT];
}

/**
 * All rows from the **Books** doctype (override with `ERPNEXT_BOOKS_DOCTYPE`),
 * newest first — for the public books index page.
 */
export async function getAllBooksFromSiteCatalog(): Promise<FooterLatestBook[]> {
  const doctype = (process.env.ERPNEXT_BOOKS_DOCTYPE || "Books").trim();
  const result = await listERPNextDocuments(
    doctype,
    {},
    booksListFieldsForCatalog(),
    { orderBy: "modified desc", limit: 200 }
  );

  const books: FooterLatestBook[] = [];
  for (const doc of result.data ?? []) {
    const row = doc as Record<string, unknown>;
    const id = String(row.name ?? "").trim();
    if (!id) continue;

    let merged = row;
    if (!pickDescription(row).trim()) {
      merged = await mergeBooksDocFromErp(doctype, id, row);
    }

    const b = mapMergedRowToFooterBook(merged);
    if (b) books.push(b);
  }

  return books;
}

/**
 * Single **Books** row by document `name` (for read / pre-order pages).
 */
export async function getSiteBookById(
  bookDocName: string
): Promise<FooterLatestBook | null> {
  const doctype = (process.env.ERPNEXT_BOOKS_DOCTYPE || "Books").trim();
  const id = bookDocName.trim();
  if (!id) return null;
  try {
    let merged: Record<string, unknown>;
    try {
      merged = await fetchBooksDocRow(doctype, id);
    } catch {
      const fullRes = await getERPNextDocument(doctype, id);
      merged = unwrapDoc<Record<string, unknown>>(fullRes);
    }
    if (!String(merged.name ?? "").trim()) return null;
    return mapMergedRowToFooterBook(merged);
  } catch {
    return null;
  }
}

function safeFilenameBase(name: string): string {
  const s = name.replace(/["'\r\n\\/<>|:*?]/g, "_").trim().slice(0, 100);
  return s || "book";
}

function erpSiteOrigin(): string {
  const { apiUrl } = getERPNextConfig();
  const normalized = apiUrl.startsWith("http") ? apiUrl : `https://${apiUrl}`;
  return new URL(normalized.endsWith("/") ? normalized : `${normalized}/`).origin;
}

/** Use integration credentials when the file URL is on the same host as ERPNext (private files). */
function upstreamHeadersForBookFile(
  fileUrl: string,
  mode: "basic" | "token"
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/pdf,application/octet-stream,*/*;q=0.8",
    "User-Agent": "ElikemWebsite/1.0 (book-proxy)",
  };
  try {
    const origin = new URL(fileUrl).origin;
    if (origin !== erpSiteOrigin()) return headers;
    const { apiKey, apiSecret } = getERPNextConfig();
    if (mode === "token") {
      headers.Authorization = `token ${apiKey}:${apiSecret}`;
    } else {
      headers.Authorization = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
    }
  } catch {
    /* ignore */
  }
  return headers;
}

const MAX_BOOK_PDF_BYTES = 80 * 1024 * 1024;

function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 4 && buf.subarray(0, 4).toString("latin1") === "%PDF";
}

/** HTML / JSON error bodies mistaken for binary */
function looksLikeNonPdfPayload(buf: Buffer): boolean {
  const head = buf.subarray(0, Math.min(256, buf.length)).toString("utf8").trimStart();
  return head.startsWith("<") || head.startsWith("{") || head.startsWith("[");
}

async function responseToBuffer(u: globalThis.Response): Promise<Buffer | null> {
  if (!u.ok) return null;
  const buf = Buffer.from(await u.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_BOOK_PDF_BYTES) return null;
  return buf;
}

/**
 * Fetches the PDF bytes from ERPNext (Attach field URL). Tries **token** auth first (Frappe
 * file routes), then Basic, then **`/api/method/download_file`**, then the legacy
 * **`frappe.utils.file_manager.download_file`** method — some hosts only serve bytes via the API.
 */
async function loadBookPdfBuffer(
  fileUrl: string
): Promise<{ buf: Buffer; mime: string } | null> {
  let pathname: string;
  try {
    pathname = new URL(fileUrl).pathname + new URL(fileUrl).search;
  } catch {
    return null;
  }

  const apiRoot = getERPNextConfig().apiUrl.replace(/\/$/, "");

  let sameErp = false;
  try {
    sameErp = new URL(fileUrl).origin === erpSiteOrigin();
  } catch {
    sameErp = false;
  }

  const attempts: { label: string; run: () => Promise<globalThis.Response> }[] = [
    {
      label: "direct-token",
      run: () =>
        fetch(fileUrl, {
          redirect: "follow",
          headers: upstreamHeadersForBookFile(fileUrl, "token"),
        }),
    },
    {
      label: "direct-basic",
      run: () =>
        fetch(fileUrl, {
          redirect: "follow",
          headers: upstreamHeadersForBookFile(fileUrl, "basic"),
        }),
    },
  ];

  if (sameErp) {
    attempts.push(
      {
        label: "api-download_file",
        run: () => {
          const methodUrl = `${apiRoot}/api/method/download_file?file_url=${encodeURIComponent(pathname)}`;
          return fetch(methodUrl, {
            redirect: "follow",
            headers: upstreamHeadersForBookFile(methodUrl, "token"),
          });
        },
      },
      {
        label: "api-file_manager-download_file",
        run: () => {
          const methodUrl = `${apiRoot}/api/method/frappe.utils.file_manager.download_file?file_url=${encodeURIComponent(pathname)}`;
          return fetch(methodUrl, {
            redirect: "follow",
            headers: upstreamHeadersForBookFile(methodUrl, "token"),
          });
        },
      }
    );
  }

  for (const a of attempts) {
    try {
      const u = await a.run();
      const buf = await responseToBuffer(u);
      if (!buf) {
        console.warn(`[booksStore] book PDF ${a.label}: empty, too large, or HTTP ${u.status}`);
        continue;
      }
      const ctRaw = u.headers.get("content-type") || "";
      const ct = ctRaw.split(";")[0].trim().toLowerCase();
      if (ct.includes("text/html") || looksLikeNonPdfPayload(buf)) {
        console.warn(
          `[booksStore] book PDF ${a.label}: non-PDF payload (ct=${ctRaw.slice(0, 60)})`,
        );
        continue;
      }
      if (!isPdfBuffer(buf)) {
        console.warn(`[booksStore] book PDF ${a.label}: missing %PDF header`);
        continue;
      }
      let mime = ct || "application/pdf";
      if (mime === "application/octet-stream" || mime === "binary/octet-stream") {
        mime = "application/pdf";
      }
      return { buf, mime };
    } catch (e) {
      console.warn(`[booksStore] book PDF ${a.label} error:`, e);
    }
  }
  return null;
}

/**
 * Proxy the free book file through this app’s origin so the PDF can be embedded in an
 * **iframe** (ERPNext / file hosts often send **X-Frame-Options: SAMEORIGIN** or **DENY**,
 * which blocks cross-origin previews).
 */
export async function streamFreeBookFileForRead(
  bookDocName: string,
  res: ExpressResponse,
  opts?: { attachment?: boolean }
): Promise<void> {
  const book = await getSiteBookById(bookDocName);
  const url = book?.bookUrl?.trim() ?? "";
  const ok =
    book &&
    book.isFree &&
    url &&
    /^https?:\/\//i.test(url);

  if (!ok) {
    if (!res.headersSent) {
      res
        .status(403)
        .type("text/plain")
        .send("This book is not available for on-site reading.");
    }
    return;
  }

  const loaded = await loadBookPdfBuffer(url);
  if (!loaded) {
    if (!res.headersSent) {
      res
        .status(502)
        .type("text/plain")
        .send(
          "Could not load a valid PDF from the Book file link. Ensure the API user can read the attached file, or use a /files or /private/files URL on the same site as ERPNEXT_API_URL."
        );
    }
    return;
  }

  const { buf, mime } = loaded;
  const base = safeFilenameBase(book!.bookName);
  const asciiName = `${base.replace(/[^\x20-\x7E]/g, "_")}.pdf`;
  const utf8Star = encodeURIComponent(`${base}.pdf`);
  res.setHeader("Content-Type", mime);
  res.setHeader(
    "Content-Disposition",
    opts?.attachment
      ? `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Star}`
      : `inline; filename="${asciiName}"; filename*=UTF-8''${utf8Star}`
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Length", String(buf.length));
  res.setHeader("Cache-Control", "private, max-age=120");
  res.end(buf);
}
