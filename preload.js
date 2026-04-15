// ============================================================
// Ritnalap — preload : pont sécurisé renderer ↔ main
// ============================================================
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ritnalap", {
  getConfig: () => ipcRenderer.invoke("config:get"),
  saveConfig: (cfg) => ipcRenderer.invoke("config:save", cfg),
  getConfigPath: () => ipcRenderer.invoke("config:path"),
  getVersion: () => ipcRenderer.invoke("app:version"),
  getAppName: () => ipcRenderer.invoke("app:name"),
  platform: process.platform,
  isElectron: true,
});
