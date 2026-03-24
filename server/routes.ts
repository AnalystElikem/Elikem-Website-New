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
