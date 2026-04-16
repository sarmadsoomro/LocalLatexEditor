import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import pino from "pino";
import projectRoutes from "./routes/projects.js";
import importRoutes from "./routes/import.js";
import { jobStore } from "./services/jobStore.js";
import compilationRoutes, {
  compilationJobRouter,
  projectPdfRouter,
  systemCheckRouter,
} from "./routes/compilation.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ensureStorageDirectories } from "./config/storage.js";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

const app = express();
const PORT = process.env.PORT || 3001;

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

async function startServer() {
  try {
    await jobStore.initialize();
    logger.info("Job store initialized");

    await ensureStorageDirectories();
    logger.info("Storage directories initialized");

    app.listen(PORT, () => {
      logger.info(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
