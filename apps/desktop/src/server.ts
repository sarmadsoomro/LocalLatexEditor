/**
 * Backend entry for the desktop app. Runs in an Electron utility process
 * (plain Node, no browser APIs); the main process passes PORT, HOST, PATH and
 * TEXCRAFT_FRONTEND_DIST in the environment.
 */
import { startServer } from "texcraft-backend";

interface ParentPort {
  postMessage(message: unknown): void;
}

const parentPort = (process as unknown as { parentPort?: ParentPort }).parentPort;

startServer(Number(process.env.PORT), process.env.HOST || "127.0.0.1")
  .then(() => parentPort?.postMessage({ type: "ready" }))
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    parentPort?.postMessage({ type: "error", message });
    // give the message a moment to reach the main process
    setTimeout(() => process.exit(1), 100);
  });
