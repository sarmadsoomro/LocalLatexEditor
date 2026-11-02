import net from "node:net";

/**
 * The app's UI lives at http://127.0.0.1:<port>, and the browser keeps
 * settings (theme, compiler options, recent state) per origin. A fixed
 * preferred port keeps that origin, and so the settings, stable across
 * launches; the next ports are only used when it is taken.
 */
export const PREFERRED_PORT = 41731;

function isFree(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, host, () => server.close(() => resolve(true)));
  });
}

export async function findFreePort(start = PREFERRED_PORT, attempts = 20, host = "127.0.0.1"): Promise<number> {
  for (let port = start; port < start + attempts; port++) {
    if (await isFree(port, host)) return port;
  }
  throw new Error(`No free port between ${start} and ${start + attempts - 1}`);
}
