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

export async function getLatestBooksFooterEntry(): Promise<FooterLatestBook | null> {
  const doctype = (process.env.ERPNEXT_BOOKS_DOCTYPE || "Books").trim();
  try {
    const result = await listERPNextDocuments(
      doctype,
      {},
      ["name", "book_name", "book", "image", "modified"],
      { orderBy: "modified desc", limit: 1 }
    );

    const row = result.data?.[0] as Record<string, unknown> | undefined;
    if (!row) return null;

    const id = String(row.name ?? "").trim();
    if (!id) return null;

    let merged: Record<string, unknown> = { ...row };
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

    const bookName =
      String(merged.book_name ?? merged.title ?? "").trim() || id || "Book";
    const description = pickDescription(merged);

    const imageUrl = resolvePublicUrl(merged.image as string);
    const bookUrl = resolvePublicUrl(merged.book as string);

    return {
      id,
      bookName,
      description,
      imageUrl,
      bookUrl,
    };
  } catch (error) {
    console.error(`[booksStore] Failed to load latest ${doctype}:`, error);
    return null;
  }
}
