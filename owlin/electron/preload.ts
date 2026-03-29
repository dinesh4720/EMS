import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('owlinElectron', {
  // Platform info
  platform: process.platform,
  isElectron: true,

  // Config management
  getConfig: () => ipcRenderer.invoke('get-config'),
  setConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('set-config', config),

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
});
