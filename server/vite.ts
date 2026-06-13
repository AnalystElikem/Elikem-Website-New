import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";

const viteLogger = createLogger();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "spa",
  });

  app.use(vite.middlewares);

  // Deep links (e.g. /books/…/read, /blog/…) must return index.html on refresh; Vite
  // middleware alone often 404s for paths that are not real files.
  app.use(async (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    const pathname = (req.originalUrl.split("?")[0] || req.originalUrl).trim();

    if (pathname.startsWith("/api")) {
      return next();
    }
    if (
      pathname.startsWith("/@") ||
      pathname.startsWith("/node_modules") ||
      pathname.startsWith("/src") ||
      pathname.startsWith("/vite-hmr")
    ) {
      return next();
    }

    const ext = path.extname(pathname);
    if (ext !== "" && ext !== ".html") {
      return next();
    }

    try {
      const template = fs.readFileSync(
        path.join(projectRoot, "index.html"),
        "utf-8",
      );
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
