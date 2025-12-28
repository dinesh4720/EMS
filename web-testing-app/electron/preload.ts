import { contextBridge, ipcRenderer } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

contextBridge.exposeInMainWorld('cdp', {
  getTabs: () => ipcRenderer.invoke('cdp:getTabs'),
  connect: (targetId: string) => ipcRenderer.invoke('cdp:connect', targetId),
  newTab: () => ipcRenderer.invoke('cdp:newTab'),
  autoConnect: () => ipcRenderer.invoke('cdp:autoConnect'),
  disconnect: () => ipcRenderer.invoke('cdp:disconnect'),
  navigate: (url: string) => ipcRenderer.invoke('cdp:navigate', url),
  click: (selector: string) => ipcRenderer.invoke('cdp:click', selector),
  type: (selector: string, text: string) => ipcRenderer.invoke('cdp:type', selector, text),
  screenshot: () => ipcRenderer.invoke('cdp:screenshot'),
  evaluate: (expression: string) => ipcRenderer.invoke('cdp:evaluate', expression),
  checkConnection: () => ipcRenderer.invoke('cdp:checkConnection'),
})

contextBridge.exposeInMainWorld('system', {
  getMousePos: () => ipcRenderer.invoke('system:getMousePos'),
  mouseMove: (x: number, y: number) => ipcRenderer.invoke('system:mouseMove', x, y),
 click: (button?: number) => ipcRenderer.invoke('system:click', button),
 doubleClick: () => ipcRenderer.invoke('system:doubleClick'),
 rightClick: () => ipcRenderer.invoke('system:rightClick'),
 drag: (sx: number, sy: number, ex: number, ey: number) => ipcRenderer.invoke('system:drag', sx, sy, ex, ey),
  type: (text: string) => ipcRenderer.invoke('system:type', text),
  screenshot: () => ipcRenderer.invoke('system:screenshot'),
  launchChrome: () => ipcRenderer.invoke('system:launchChrome'),
})
