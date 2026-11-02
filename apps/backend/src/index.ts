import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import pino from "pino";

import { ensureStorageDirectories } from "./config/storage.js";
import { errorHandler } from "./middleware/errorHandler.js";
import compilationRoutes, {
  compilationJobRouter,
  projectPdfRouter,
  systemCheckRouter,
} from "./routes/compilation.js";
import importRoutes from "./routes/import.js";
import projectRoutes from "./routes/projects.js";
import { jobStore } from "./services/jobStore.js";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || "127.0.0.1";

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
  allowedHeaders: ['Content-Type', 'Cache-Control', 'Pragma', 'Expires'],
}));
app.use(express.json());

app.use("/api", apiLimiter);
app.use("/api/projects/:id/compile", compileLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/projects", projectRoutes);
app.use("/api/projects/:id", compilationRoutes);
app.use("/api/projects/:id", projectPdfRouter);
app.use("/api/compile", compilationJobRouter);
app.use("/api", systemCheckRouter);
app.use("/api", importRoutes);

app.use(errorHandler);

async function startServer(): Promise<void> {
  try {
    await jobStore.initialize();
    logger.info("Job store initialized");

    await ensureStorageDirectories();
    logger.info("Storage directories initialized");

    if (!isLoopbackHost(HOST)) {
      logger.error(
        `WARNING: HOST=${HOST} is not a loopback address. Other machines can reach this API.`,
      );
    }

    app.listen(PORT, HOST, () => {
      logger.info(`Backend server running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

function isLoopbackHost(host: string): boolean {
  return host === "127.0.0.1" || host === "localhost" || host === "::1" || host === "[::1]";
}
