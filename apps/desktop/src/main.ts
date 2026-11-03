/**
 * TexCraft desktop: starts the bundled backend in a utility process on
 * 127.0.0.1 and shows the app in a window. No browser, Node or pnpm needed.
 */
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  app,
  BrowserWindow,
  dialog,
  Menu,
  session,
  shell,
  utilityProcess,
  type MenuItemConstructorOptions,
  type UtilityProcess,
  type WebContents,
} from "electron";

import { findFreePort } from "./port.js";
import { pathWithTex } from "./texPath.js";

const REPO_URL = "https://github.com/sarmadsoomro/TexCraft";
const HOST = "127.0.0.1";

let backend: UtilityProcess | null = null;
let mainWindow: BrowserWindow | null = null;
let origin = "";
let quitting = false;
/**
 * Per-launch API token. It stays in this process and the backend: the page never
 * sees it. Electron adds it to the app's own requests (see addTokenToRequests),
 * so another program or user on this computer that connects to the port gets a
 * page without the token and every API call fails with 401.
 */
const sessionToken = randomBytes(32).toString("hex");

function frontendDist(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "frontend")
    : path.join(__dirname, "..", "..", "frontend", "dist");
}

function logFile(): string {
  return path.join(app.getPath("logs"), "backend.log");
}

function backendEnv(port: number): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined) env[k] = v;
  const texPath = pathWithTex({
    platform: process.platform,
    arch: process.arch,
    home: app.getPath("home"),
    env: process.env,
    listDir: (dir) => {
      try {
        return fs.readdirSync(dir);
      } catch {
        return [];
      }
    },
    isDir: (dir) => {
      try {
        return fs.statSync(dir).isDirectory();
      } catch {
        return false;
      }
    },
  });
  if (process.platform === "win32" && env.Path !== undefined) delete env.Path;
  return {
    ...env,
    PATH: texPath,
    PORT: String(port),
    HOST,
    NODE_ENV: "production",
    TEXCRAFT_PLAIN_LOGS: "1",
    TEXCRAFT_FRONTEND_DIST: frontendDist(),
    TEXCRAFT_SESSION_TOKEN: sessionToken,
  };
}

function startBackend(port: number): Promise<void> {
  fs.mkdirSync(path.dirname(logFile()), { recursive: true });
  const log = fs.createWriteStream(logFile(), { flags: "w" });

  const child = utilityProcess.fork(path.join(__dirname, "server.cjs"), [], {
    env: backendEnv(port),
    stdio: "pipe",
    serviceName: "TexCraft backend",
  });
  backend = child;
  child.stdout?.pipe(log);
  child.stderr?.pipe(log);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("The backend did not start within 30 seconds.")), 30_000);
    child.on("message", (msg: { type?: string; message?: string }) => {
      if (msg?.type === "ready") {
        clearTimeout(timer);
        resolve();
      } else if (msg?.type === "error") {
        clearTimeout(timer);
        reject(new Error(msg.message || "The backend failed to start."));
      }
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      backend = null;
      reject(new Error(`The backend exited during startup (code ${code}).`));
      if (!quitting && mainWindow) {
        dialog.showErrorBox(
          "TexCraft stopped working",
          `The TexCraft engine exited unexpectedly (code ${code}). Your files are saved on disk.\n\nRestart TexCraft. Details are in:\n${logFile()}`,
        );
        app.quit();
      }
    });
  });
}

function isAppUrl(url: string): boolean {
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

function openExternal(url: string): void {
  try {
    const { protocol } = new URL(url);
    if (protocol === "https:" || protocol === "http:" || protocol === "mailto:") void shell.openExternal(url);
  } catch {
    /* not a URL */
  }
}

/** Keep the app inside its own origin; everything else opens in the user's browser. */
function lockDown(contents: WebContents, allowBlob: boolean): void {
  contents.on("will-navigate", (event, url) => {
    if (isAppUrl(url) || (allowBlob && url.startsWith("blob:"))) return;
    event.preventDefault();
    openExternal(url);
  });
  contents.setWindowOpenHandler(({ url }) => {
    // "Open PDF in new tab" opens about:blank, then points it at a blob: URL
    if (url === "about:blank" || url === "" || isAppUrl(url)) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 1000,
          height: 900,
          autoHideMenuBar: true,
          webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
        },
      };
    }
    openExternal(url);
    return { action: "deny" };
  });
}

/** Add the token to every request the app's windows make to its own backend. */
function addTokenToRequests(): void {
  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: [`${origin}/*`] }, (details, callback) => {
    callback({ requestHeaders: { ...details.requestHeaders, "X-TexCraft-Token": sessionToken } });
  });
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: "TexCraft",
    backgroundColor: "#F8FAFC",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });
  mainWindow = win;
  lockDown(win.webContents, false);
  win.webContents.on("did-create-window", (child) => lockDown(child.webContents, true));
  win.once("ready-to-show", () => win.show());
  if (process.env.TEXCRAFT_SMOKE_TEST === "1") smokeTest(win);
  win.on("closed", () => {
    mainWindow = null;
  });
  void win.loadURL(`${origin}/`);
}

/**
 * CI check of a packaged build: the page loads, the token is not in it, its API
 * calls reach the backend (Electron adds the token), and a request from outside
 * the app is refused. Exits 0 on success, 1 otherwise.
 */
function smokeTest(win: BrowserWindow): void {
  const fail = (why: string): void => {
    console.error(`SMOKE TEST FAILED: ${why}`);
    app.exit(1);
  };
  setTimeout(() => fail("timed out after 60 s"), 60_000).unref();
  win.webContents.once("did-fail-load", (_e, code, description) => fail(`page load failed: ${code} ${description}`));
  win.webContents.once("did-finish-load", () => {
    void (async (): Promise<void> => {
      // Inside the app: no token in the page, yet API calls succeed.
      const res = (await win.webContents.executeJavaScript(
        `fetch("/api/system/latex-check")
           .then(async (r) => ({ status: r.status, inPage: window.__TEXCRAFT_TOKEN__ || "", body: await r.json() }))`,
      )) as { status: number; inPage: string; body: { data?: { latexInstalled?: boolean } } };
      if (res.inPage) return fail("the token is in the page");
      if (res.status !== 200) return fail(`latex-check from the app returned ${res.status}`);
      // Outside the app (plain Node fetch, no Electron session): no token anywhere.
      const page = await (await fetch(`${origin}/`)).text();
      if (page.includes(sessionToken)) return fail("the served page contains the token");
      const outside = await fetch(`${origin}/api/system/latex-check`);
      if (outside.status !== 401) return fail(`a request from outside the app returned ${outside.status}, not 401`);
      console.log(`SMOKE TEST OK: ${origin}, LaTeX installed: ${res.body.data?.latexInstalled}`);
      app.exit(0);
    })().catch((error: unknown) => fail(String(error)));
  });
}

function buildMenu(): void {
  const isMac = process.platform === "darwin";
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: "appMenu" as const }] : []),
    { role: "fileMenu" },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        { label: "TexCraft on GitHub", click: () => openExternal(REPO_URL) },
        { label: "Report a Problem", click: () => openExternal(`${REPO_URL}/issues/new`) },
        { label: "Install LaTeX", click: () => openExternal("https://www.latex-project.org/get/") },
        { type: "separator" },
        { label: "Show Log File", click: () => shell.showItemInFolder(logFile()) },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function boot(): Promise<void> {
  buildMenu();
  const port = await findFreePort();
  origin = `http://${HOST}:${port}`;
  addTokenToRequests();
  await startBackend(port);
  createWindow();
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.on("web-contents-created", (_event, contents) => {
    // the app never needs camera, microphone, location or notifications
    contents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  });

  app
    .whenReady()
    .then(boot)
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      dialog.showErrorBox("TexCraft could not start", `${message}\n\nDetails are in:\n${logFile()}`);
      app.exit(1);
    });

  app.on("activate", () => {
    // macOS: clicking the Dock icon with no window open
    if (!mainWindow && backend && origin) createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", () => {
    quitting = true;
    backend?.kill();
  });
}
