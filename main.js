// ============================================================
// Ritnalap — Electron main process
// ============================================================
const { app, BrowserWindow, ipcMain, safeStorage, session, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");

const CONFIG_PATH = () => path.join(app.getPath("userData"), "config.json");

// -- Stockage config (clés API chiffrées via safeStorage quand dispo) --
function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH(), "utf-8");
    const obj = JSON.parse(raw);
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string" && v.startsWith("enc:") && safeStorage.isEncryptionAvailable()) {
        try {
          out[k] = safeStorage.decryptString(Buffer.from(v.slice(4), "base64"));
        } catch {
          out[k] = "";
        }
      } else {
        out[k] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function saveConfig(cfg) {
  const out = {};
  for (const [k, v] of Object.entries(cfg || {})) {
    if (typeof v === "string" && v && safeStorage.isEncryptionAvailable()) {
      out[k] = "enc:" + safeStorage.encryptString(v).toString("base64");
    } else {
      out[k] = v;
    }
  }
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH()), { recursive: true });
    fs.writeFileSync(CONFIG_PATH(), JSON.stringify(out, null, 2));
    return true;
  } catch (e) {
    console.error("saveConfig error:", e);
    return false;
  }
}

// -- Fenêtre principale --
function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#000000",
    title: "Ritnalap",
    icon: path.join(__dirname, "build", process.platform === "win32" ? "icon.ico" : "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // bypass CORS pour les APIs publiques
    },
  });

  // Strip des headers qui bloquent les iframes/embed des webcams
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders || {};
    for (const h of Object.keys(headers)) {
      const low = h.toLowerCase();
      if (low === "x-frame-options" || low === "content-security-policy" || low === "content-security-policy-report-only") {
        delete headers[h];
      }
    }
    callback({ responseHeaders: headers });
  });

  // Ouvrir les liens externes dans le navigateur par défaut
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.loadFile("index.html");

  // Menu minimal
  const template = [
    {
      label: "Ritnalap",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "quit", label: "Quitter" },
      ],
    },
    {
      label: "Édition",
      submenu: [
        { role: "undo", label: "Annuler" },
        { role: "redo", label: "Rétablir" },
        { type: "separator" },
        { role: "cut", label: "Couper" },
        { role: "copy", label: "Copier" },
        { role: "paste", label: "Coller" },
        { role: "pasteAndMatchStyle", label: "Coller en tant que texte brut" },
        { role: "delete", label: "Supprimer" },
        { role: "selectAll", label: "Tout sélectionner" },
      ],
    },
    {
      label: "Affichage",
      submenu: [
        { role: "togglefullscreen", label: "Plein écran" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// -- IPC --
ipcMain.handle("config:get", () => loadConfig());
ipcMain.handle("config:save", (_e, cfg) => saveConfig(cfg));
ipcMain.handle("config:path", () => CONFIG_PATH());
ipcMain.handle("app:version", () => app.getVersion());
ipcMain.handle("app:name", () => app.getName());

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
