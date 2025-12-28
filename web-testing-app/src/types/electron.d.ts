export interface CDP {
  getTabs: () => Promise<any[]>;
  connect: (targetId: string) => Promise<{ success: boolean; error?: string }>;
  newTab: () => Promise<{ success: boolean; targetId?: string; error?: string }>;
  autoConnect: () => Promise<{ success: boolean; error?: string }>;
  disconnect: () => Promise<{ success: boolean }>;
  navigate: (url: string) => Promise<{ success: boolean; error?: string }>;
  click: (selector: string) => Promise<{ success: boolean; error?: string }>;
  type: (selector: string, text: string) => Promise<{ success: boolean; error?: string }>;
  screenshot: () => Promise<{ success: boolean; data?: string; error?: string }>;
  evaluate: (expression: string) => Promise<{ success: boolean; result?: any; error?: string }>;
  checkConnection: () => Promise<{ success: boolean; data?: string; error?: string }>;
}

export interface SystemControl {
  getMousePos: () => Promise<{ success: boolean; x?: number; y?: number; error?: string }>;
  mouseMove: (x: number, y: number) => Promise<{ success: boolean; error?: string }>;
  click: (button?: number) => Promise<{ success: boolean; error?: string }>;
  doubleClick: () => Promise<{ success: boolean; error?: string }>;
  rightClick: () => Promise<{ success: boolean; error?: string }>;
  drag: (sx: number, sy: number, ex: number, ey: number) => Promise<{ success: boolean; error?: string }>;
  type: (text: string) => Promise<{ success: boolean; error?: string }>;
  screenshot: () => Promise<{ success: boolean; data?: string; error?: string }>;
  launchChrome: () => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    cdp: CDP;
    system: SystemControl;
    ipcRenderer: import('electron').IpcRenderer;
  }
}
