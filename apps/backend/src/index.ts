import fs from "node:fs";
import type { Server } from "node:http";
import path from "node:path";

import cors from "cors";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import pino from "pino";

import { createSessionToken, injectSessionToken, shellSessionToken } from "./config/sessionToken.js";
import { ensureStorageDirectories } from "./config/storage.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireApiToken } from "./middleware/requireApiToken.js";
import { requireLoopbackHost } from "./middleware/requireLoopbackHost.js";
import compilationRoutes, {
  compilationJobRouter,
  projectPdfRouter,
  systemCheckRouter,
} from "./routes/compilation.js";
import importRoutes from "./routes/import.js";
import projectRoutes from "./routes/projects.js";
import synctexRoutes from "./routes/synctex.js";
import texPackageRoutes from "./routes/texPackages.js";
import { jobStore } from "./services/jobStore.js";

// pino-pretty runs in a worker thread loaded by name, which a bundled build
// (the desktop app) cannot resolve, so the desktop app asks for plain JSON logs.
const logger =
  process.env.TEXCRAFT_PLAIN_LOGS === "1"
    ? pino()
    : pino({
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        },
      });

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "127.0.0.1";

export interface AppOptions {
  /**
   * Put the token in the served page (window.__TEXCRAFT_TOKEN__). Needed when the
   * app runs in a normal browser. The desktop app turns it off and adds the token
   * to each request in the main process instead.
   */
  tokenInPage?: boolean;
}

export function createApp(token: string, port: number = PORT, options: AppOptions = {}): Express {
  const tokenInPage = options.tokenInPage ?? true;
  const app = express();

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' }, data: null },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const compileLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many compilation requests' }, data: null },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-TexCraft-Token', 'Cache-Control', 'Pragma', 'Expires'],
  }));
  app.use(requireLoopbackHost(port));
  app.use(express.json());

  app.use("/api", requireApiToken(token));
  app.use("/api", apiLimiter);
  app.use("/api/projects/:id/compile", compileLimiter);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/projects", projectRoutes);
  app.use("/api/projects/:id", compilationRoutes);
  app.use("/api/projects/:id", projectPdfRouter);
  app.use("/api/projects/:id", synctexRoutes);
  app.use("/api/compile", compilationJobRouter);
  app.use("/api", systemCheckRouter);
  app.use("/api/system/packages", texPackageRoutes);
  app.use("/api", importRoutes);

  // TEXCRAFT_FRONTEND_DIST: where the desktop app ships the built frontend
  const frontendDist = process.env.TEXCRAFT_FRONTEND_DIST || path.resolve(__dirname, "../../frontend/dist");
  const indexPath = path.join(frontendDist, "index.html");
  if (fs.existsSync(indexPath)) {
    app.use(express.static(frontendDist, { index: false }));
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api") || req.path === "/health") {
        next();
        return;
      }
      res.type("html").send(injectSessionToken(fs.readFileSync(indexPath, "utf8"), tokenInPage ? token : ""));
    });
  }

  app.use(errorHandler);
  return app;
}

/** Starts the API (and the built frontend, when present). Rejects if the port is taken. */
export async function startServer(port: number = PORT, host: string = HOST): Promise<Server> {
  await jobStore.initialize();
  logger.info("Job store initialized");

  await ensureStorageDirectories();
  logger.info("Storage directories initialized");

  const token = createSessionToken();
  logger.info("Session token written for this launch");

  if (!isLoopbackHost(host)) {
    logger.error(
      `WARNING: HOST=${host} is not a loopback address. Other machines can reach this API.`,
    );
  }

  const app = createApp(token, port, { tokenInPage: shellSessionToken() === null });
  return new Promise((resolve, reject) => {
    const server = app.listen(port, host);
    server.once("error", reject);
    server.once("listening", () => {
      server.off("error", reject);
      logger.info(`Backend server running on http://${host}:${port}`);
      resolve(server);
    });
  });
}

const startedAsMain = process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js");
if (startedAsMain) {
  startServer().catch((error: unknown) => {
    logger.error(error, "Failed to start server");
    process.exit(1);
  });
}

function isLoopbackHost(host: string): boolean {
  return host === "127.0.0.1" || host === "localhost" || host === "::1" || host === "[::1]";
}
