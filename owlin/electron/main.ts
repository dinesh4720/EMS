import { app, BrowserWindow, Menu, Tray, shell, nativeImage, dialog } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// ── Config persistence ─────────────────────────────────────────────────────

interface AppConfig {
  serverUrl: string;
  adminKey: string;
  windowBounds?: { width: number; height: number; x?: number; y?: number };
}

const CONFIG_PATH = join(app.getPath('userData'), 'owlin-config.json');

function loadConfig(): AppConfig {
  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch { /* ignore */ }
  return {
    serverUrl: 'http://localhost:4001',
    adminKey: '',
  };
}

function saveConfig(config: AppConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// ── Window creation ────────────────────────────────────────────────────────

function createWindow(): void {
  const config = loadConfig();
  const bounds = config.windowBounds ?? { width: 1280, height: 800 };

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 900,
    minHeight: 600,
    title: 'Owlin Analytics',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#1a1a1e',
    hasShadow: true,
    roundedCorners: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Only show window after content is painted — prevents blank flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // In dev, load Vite dev server; in prod, load the built files
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Save window bounds on resize/move
  mainWindow.on('close', () => {
    if (mainWindow) {
      const config = loadConfig();
      config.windowBounds = mainWindow.getBounds();
      saveConfig(config);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── Tray icon ──────────────────────────────────────────────────────────────

function createTray(): void {
  // Use a simple owl emoji as tray icon (will be replaced with proper .png later)
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setTitle('🦉');
  tray.setToolTip('Owlin Analytics');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Owlin',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Configure Server...',
      click: () => configureServer(),
    },
    { type: 'separator' },
    {
      label: 'Quit Owlin',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    } else {
      createWindow();
    }
  });
}

// ── Server configuration dialog ────────────────────────────────────────────

async function configureServer(): Promise<void> {
  const config = loadConfig();

  // Use a simple prompt dialog (Electron doesn't have native prompts, so we use a message box)
  const result = await dialog.showMessageBox({
    type: 'info',
    title: 'Server Configuration',
    message: `Current server: ${config.serverUrl}\nAdmin key: ${config.adminKey ? '***configured***' : 'not set'}`,
    detail: 'To change the server URL or admin key, edit the config file directly.',
    buttons: ['Open Config File', 'OK'],
  });

  if (result.response === 0) {
    shell.openPath(CONFIG_PATH);
  }
}

// ── Application menu ───────────────────────────────────────────────────────

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Configure Server...',
          accelerator: 'CmdOrCtrl+,',
          click: () => configureServer(),
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── App lifecycle ──────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createMenu();
  createTray();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep the app running in the tray
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
