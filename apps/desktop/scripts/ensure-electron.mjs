// The Electron binary is not downloaded by `pnpm install` (see
// pnpm.neverBuiltDependencies in the root package.json), so the web app's
// install stays small. Fetch it the first time someone runs the desktop app.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
try {
  require("electron"); // throws when the binary is missing
} catch {
  console.log("Downloading Electron (first run only)...");
  const pkg = path.dirname(require.resolve("electron/package.json"));
  execFileSync(process.execPath, [path.join(pkg, "install.js")], { stdio: "inherit" });
}
