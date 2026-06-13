import type { Express } from "express";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { isEmailSubscribed } from "./newsletterStore.js";
import { subscribeEmailToNewsletter } from "./newsletterStore.js";
import {
  createAccessToken,
  getEmailFromAccessToken,
} from "./accessToken.js";
import {
  listDriveFiles,
  listDrivePreviews,
  streamDriveFileDownload,
} from "./driveStore.js";
import {
  getLatestBooksFooterEntry,
  getAllBooksFromSiteCatalog,
  getSiteBookById,
  streamFreeBookFileForRead,
} from "./booksStore.js";
import { submitFreeGiftSignup } from "./bookGiftStore.js";
import { submitWebsiteEnquiry } from "./enquiryStore.js";
import { createBookOrder, getOrders } from "./ordersStore.js";
import { submitBookPreorder } from "./preorderStore.js";
import {
  getAllBlogPosts,
  getBlogPostByRoute,
  getFeaturedBlogPosts,
  getBlogPostsByCategory,
  getBlogCategories,
} from "./blogStore.js";
import {
  incrementBlogReads,
  getBlogReads,
} from "./commentStore.js";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const router = express.Router();

  router.post(
    "/newsletter/verify",
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!email) {
        res.status(400).json({ subscribed: false, reason: "missing_email" });
        return;
      }

      const subscribed = await isEmailSubscribed(email);
      res.json({ subscribed });
    }),
  );

  router.post(
    "/newsletter/subscribe",
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!email) {
        res.status(400).json({ subscribed: false, reason: "missing_email" });
        return;
      }

      await subscribeEmailToNewsletter(email);
      res.json({ subscribed: await isEmailSubscribed(email) });
    }),
  );

  router.post(
    "/access/token",
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const email = String(req.body?.email || "").trim().toLowerCase();
      if (!email) {
        res.status(400).json({ token: null, reason: "missing_email" });
        return;
      }

      const subscribed = await isEmailSubscribed(email);
      if (!subscribed) {
        res.status(403).json({ token: null, reason: "not_subscribed" });
        return;
      }

      const token = createAccessToken(email);
      res.json({ token });
    }),
  );

  router.get("/drive/list", asyncHandler(async (req: Request, res: Response) => {
    const token = getTokenFromRequest(req);
    if (!token) {
      res.status(401).json({ reason: "missing_token" });
      return;
    }

    const email = getEmailFromAccessToken(token);
    if (!email) {
      res.status(401).json({ reason: "invalid_token" });
      return;
    }

    const subscribed = await isEmailSubscribed(email);
    if (!subscribed) {
      res.status(403).json({ reason: "not_subscribed" });
      return;
    }

    const files = await listDriveFiles();
    res.json({ files });
  }));

  // Public read-only preview list for journal cards.
  router.get(
    "/drive/previews",
    asyncHandler(async (_req: Request, res: Response) => {
      const files = await listDrivePreviews(9);
      res.json({ files });
    }),
  );

  router.get(
    "/drive/download/:fileId",
    asyncHandler(async (req: Request, res: Response) => {
      const token = getTokenFromRequest(req);
      if (!token) {
        res.status(401).json({ reason: "missing_token" });
        return;
      }

      const email = getEmailFromAccessToken(token);
      if (!email) {
        res.status(401).json({ reason: "invalid_token" });
        return;
      }

      const subscribed = await isEmailSubscribed(email);
      if (!subscribed) {
        res.status(403).json({ reason: "not_subscribed" });
        return;
      }

      const fileId = req.params.fileId;
      if (!fileId) {
        res.status(400).json({ reason: "missing_fileId" });
        return;
      }

      await streamDriveFileDownload(fileId, res);
    }),
  );

  router.get(
    "/books/footer/latest",
    asyncHandler(async (_req: Request, res: Response) => {
      res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      const book = await getLatestBooksFooterEntry();
      res.json({ book });
    }),
  );

  /** All rows from ERPNext **Books** doctype (`ERPNEXT_BOOKS_DOCTYPE`), for the public books page */
  router.get(
    "/books/catalog",
    asyncHandler(async (_req: Request, res: Response) => {
      res.setHeader(
        "Cache-Control",
        "public, s-maxage=120, stale-while-revalidate=300",
      );
      const books = await getAllBooksFromSiteCatalog();
      res.json({ books });
    }),
  );

  router.get(
    "/books/catalog/:bookId",
    asyncHandler(async (req: Request, res: Response) => {
      const raw = String(req.params.bookId || "").trim();
      const bookId = raw;
      if (!bookId) {
        res.status(400).json({ reason: "missing_book_id" });
        return;
      }
      const book = await getSiteBookById(bookId);
      if (!book) {
        res.status(404).json({ reason: "book_not_found" });
        return;
      }
      res.setHeader("Cache-Control", "public, max-age=60");
      res.json({ book });
    }),
  );

  /** Same-origin PDF stream for on-site reader (embeds without ERPNext X-Frame-Options issues). */
  router.get(
    "/books/read/:bookId/stream",
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const bookId = String(req.params.bookId || "").trim();
      if (!bookId) {
        res.status(400).type("text/plain").send("missing_book_id");
        return;
      }
      const attachment = String(req.query.attachment || "") === "1";
      await streamFreeBookFileForRead(bookId, res, { attachment });
    }),
  );

  router.post(
    "/books/preorder",
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const book = String(req.body?.book || "").trim();
      const email = String(req.body?.email || "").trim();
      const fullName = String(
        req.body?.full_name ?? req.body?.fullName ?? ""
      ).trim();
      const phone = String(
        req.body?.phone_number ?? req.body?.phone ?? req.body?.phoneNumber ?? ""
      ).trim();
      const quantity =
        req.body?.quantity ?? req.body?.qty ?? req.body?.qty_ordered;
      if (!book) {
        res.status(400).json({ ok: false, reason: "missing_book" });
        return;
      }
      if (!email) {
        res.status(400).json({ ok: false, reason: "missing_email" });
        return;
      }
      if (!fullName) {
        res.status(400).json({ ok: false, reason: "missing_full_name" });
        return;
      }
      if (!phone) {
        res.status(400).json({ ok: false, reason: "missing_phone" });
        return;
      }

      const row = await getSiteBookById(book);
      if (!row) {
        res.status(404).json({ ok: false, reason: "book_not_found" });
        return;
      }
      if (!row.isPreorder) {
        res.status(400).json({ ok: false, reason: "not_preorder" });
        return;
      }

      try {
        const { docName } = await submitBookPreorder(
          book,
          email,
          fullName,
          phone,
          quantity,
        );
        res.json({ ok: true, docName });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "missing_book" || msg === "missing_email") {
          res.status(400).json({ ok: false, reason: msg });
          return;
        }
        if (msg === "missing_phone") {
          res.status(400).json({ ok: false, reason: "missing_phone" });
          return;
        }
        if (msg === "invalid_phone" || msg === "phone_too_long") {
          res.status(400).json({ ok: false, reason: msg });
          return;
        }
        if (msg === "missing_full_name") {
          res.status(400).json({ ok: false, reason: "missing_full_name" });
          return;
        }
        if (msg === "full_name_too_long") {
          res.status(400).json({ ok: false, reason: "full_name_too_long" });
          return;
        }
        if (msg === "invalid_quantity") {
          res.status(400).json({ ok: false, reason: "invalid_quantity" });
          return;
        }
        if (msg === "invalid_email") {
          res.status(400).json({ ok: false, reason: "invalid_email" });
          return;
        }
        if (msg === "erpnext_create_no_name") {
          res.status(502).json({ ok: false, reason: "erpnext_create_failed" });
          return;
        }
        if (msg.startsWith("ERPNext API error")) {
          console.error("[books/preorder]", err);
          res.status(502).json({ ok: false, reason: "erpnext", detail: msg });
          return;
        }
        console.error("[books/preorder]", err);
        res.status(500).json({ ok: false, reason: "server_error" });
      }
    }),
  );

  router.post(
    "/books/gift-signup",
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const email = String(req.body?.email || "").trim();
      if (!email) {
        res.status(400).json({ ok: false, reason: "missing_email" });
        return;
      }
      try {
        const { giftName } = await submitFreeGiftSignup(email);
        res.json({ ok: true, giftName });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "invalid_email" || msg === "missing_email") {
          res.status(400).json({ ok: false, reason: msg });
          return;
        }
        if (msg === "no_book") {
          res.status(503).json({ ok: false, reason: "no_book" });
          return;
        }
        if (msg === "no_book_pdf") {
          res.status(503).json({ ok: false, reason: "no_book_pdf" });
          return;
        }
        if (msg === "erpnext_create_no_name") {
          res.status(502).json({ ok: false, reason: "erpnext_create_failed" });
          return;
        }
        if (msg.startsWith("ERPNext API error")) {
          console.error("[books/gift-signup]", err);
          res.status(502).json({ ok: false, reason: "erpnext", detail: msg });
          return;
        }
        console.error("[books/gift-signup]", err);
        res.status(500).json({ ok: false, reason: "server_error" });
      }
    }),
  );

  router.post(
    "/enquiry",
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim();
      const phone = String(req.body?.phone ?? "").trim();
      const topic = String(req.body?.topic || "general").trim();
      const message = String(req.body?.message || "").trim();

      if (!name) {
        res.status(400).json({ ok: false, reason: "missing_name" });
        return;
      }
      if (!message) {
        res.status(400).json({ ok: false, reason: "missing_feedback" });
        return;
      }

      try {
        const { docName } = await submitWebsiteEnquiry({
          name,
          email,
          phone,
          topic,
          message,
        });
        res.json({ ok: true, docName });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg === "missing_name" ||
          msg === "missing_contact" ||
          msg === "invalid_email" ||
          msg === "missing_feedback" ||
          msg === "feedback_too_long"
        ) {
          res.status(400).json({ ok: false, reason: msg });
          return;
        }
        if (msg === "erpnext_create_no_name") {
          res.status(502).json({ ok: false, reason: "erpnext_create_failed" });
          return;
        }
        if (msg.startsWith("ERPNext API error")) {
          console.error("[enquiry]", err);
          res.status(502).json({ ok: false, reason: "erpnext", detail: msg });
          return;
        }
        if (msg.includes("Missing ERPNext configuration")) {
          res.status(503).json({ ok: false, reason: "erpnext_not_configured" });
          return;
        }
        console.error("[enquiry]", err);
        res.status(500).json({
          ok: false,
          reason: "server_error",
          ...(process.env.NODE_ENV !== "production"
            ? { hint: msg.slice(0, 240) }
            : {}),
        });
      }
    }),
  );

  // 📚 BOOKS ENDPOINTS
  router.get(
    "/books",
    asyncHandler(async (_req: Request, res: Response) => {
      const files = await listDrivePreviews(100);
      res.json({ books: files });
    }),
  );

  router.post(
    "/books/order",
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const name = String(req.body?.name || "").trim();
      const bookTitle = String(req.body?.bookTitle || "").trim();
      const quantity = parseInt(String(req.body?.quantity || "1"), 10);
      const deliveryAddress = String(req.body?.deliveryAddress || "").trim();
      const phone = String(req.body?.phone || "").trim();

      if (!email || !name || !bookTitle || quantity < 1) {
        res.status(400).json({
          ordered: false,
          reason: "missing_required_fields",
          required: ["email", "name", "bookTitle", "quantity"],
        });
        return;
      }

      await createBookOrder({
        email,
        name,
        bookTitle,
        quantity,
        deliveryAddress: deliveryAddress || undefined,
        phone: phone || undefined,
      });

      res.json({ ordered: true, message: "Order placed successfully" });
    }),
  );

  router.get(
    "/books/my-orders",
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const token = getTokenFromRequest(req);
      if (!token) {
        res.status(401).json({ reason: "missing_token" });
        return;
      }

      const email = getEmailFromAccessToken(token);
      if (!email) {
        res.status(401).json({ reason: "invalid_token" });
        return;
      }

      const orders = await getOrders(email);
      res.json({ orders });
    }),
  );

  // 📝 BLOG ENDPOINTS

  // Get all blog posts
  router.get(
    "/blog",
    asyncHandler(async (_req: Request, res: Response): Promise<void> => {
      const posts = await getAllBlogPosts();
      res.json({ posts });
    }),
  );

  // Get featured blog posts (must come before /:route to avoid ambiguity)
  router.get(
    "/blog/featured",
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const limit = parseInt(String(req.query.limit || "3"), 10);
      const posts = await getFeaturedBlogPosts(limit);
      res.json({ posts });
    }),
  );

  // Get all blog categories
  router.get(
    "/blog/categories",
    asyncHandler(async (_req: Request, res: Response): Promise<void> => {
      const categories = await getBlogCategories();
      res.json({ categories });
    }),
  );

  // Get blog posts by category (must come before /:route to avoid ambiguity)
  router.get(
    "/blog/category/:category",
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const category = String(req.params.category || "");
      if (!category) {
        res.status(400).json({ reason: "missing_category" });
        return;
      }

      const posts = await getBlogPostsByCategory(category);
      res.json({ posts });
    }),
  );

  // � BLOG READS ENDPOINTS (MUST COME BEFORE THE GENERIC BLOG ROUTE)

  // Get read count for a blog post
  router.get(
    /^\/blog\/([^/]+)\/reads$/,
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const blogName = req.params[0] as string;
      if (!blogName) {
        res.status(400).json({ reason: "missing_blog_name" });
        return;
      }

      const reads = await getBlogReads(blogName);
      res.json({ reads });
    }),
  );

  // Increment read count for a blog post
  router.post(
    /^\/blog\/([^/]+)\/reads$/,
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const blogName = req.params[0] as string;
      if (!blogName) {
        res.status(400).json({ reason: "missing_blog_name" });
        return;
      }

      const reads = await incrementBlogReads(blogName);
      res.json({ reads, message: "Read count incremented" });
    }),
  );

  // Get a single blog post by name (MUST COME LAST after specific routes)
  router.get(
    /^\/blog\/([^/]+)$/,
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const blogName = req.params[0] as string;
      if (!blogName) {
        res.status(400).json({ reason: "missing_blog_name" });
        return;
      }

      const post = await getBlogPostByRoute(blogName);
      if (!post) {
        res.status(404).json({ reason: "blog_post_not_found" });
        return;
      }

      res.json({ post });
    }),
  );

  // prefix all routes with /api
  app.use("/api", router);

  return httpServer;
}

function getTokenFromRequest(req: Request): string | null {
  const auth = req.header("authorization") || "";
  const bearerPrefix = "bearer ";
  const bearer =
    auth.toLowerCase().startsWith(bearerPrefix)
      ? auth.slice(bearerPrefix.length)
      : null;
  const queryToken = req.query.token ? String(req.query.token) : null;
  return bearer || queryToken;
}

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}
