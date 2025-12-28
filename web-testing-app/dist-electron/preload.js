"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
});
electron.contextBridge.exposeInMainWorld("cdp", {
  getTabs: () => electron.ipcRenderer.invoke("cdp:getTabs"),
  connect: (targetId) => electron.ipcRenderer.invoke("cdp:connect", targetId),
  disconnect: () => electron.ipcRenderer.invoke("cdp:disconnect"),
  navigate: (url) => electron.ipcRenderer.invoke("cdp:navigate", url),
  click: (selector) => electron.ipcRenderer.invoke("cdp:click", selector),
  type: (selector, text) => electron.ipcRenderer.invoke("cdp:type", selector, text),
  screenshot: () => electron.ipcRenderer.invoke("cdp:screenshot"),
  evaluate: (expression) => electron.ipcRenderer.invoke("cdp:evaluate", expression)
});
