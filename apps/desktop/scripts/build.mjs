// Bundles the Electron main process and the backend into dist/ (CommonJS).
// Everything the backend needs (express, pino, zod, shared-types, ...) is
// inlined, so the packaged app ships no node_modules.
import { build } from "esbuild";

const common = {
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: true,
  logLevel: "warning",
  legalComments: "linked",
};

await Promise.all([
  build({ ...common, entryPoints: ["src/main.ts"], outfile: "dist/main.cjs", external: ["electron"] }),
  build({ ...common, entryPoints: ["src/server.ts"], outfile: "dist/server.cjs" }),
]);
console.log("built dist/main.cjs and dist/server.cjs");
