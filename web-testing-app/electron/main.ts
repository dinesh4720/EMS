import { app, BrowserWindow, ipcMain, globalShortcut, desktopCapturer } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import CDP from 'chrome-remote-interface'
import http from 'http'
import { spawn } from 'child_process'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
let cdpClient: any = null;
let inputHelperProcess: any = null;

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function startInputHelper() {
    // In dev, __dirname is electron/, but exe is in electron/ (or we should move it)
    // Actually, in dev with vite-plugin-electron, main process runs from dist-electron/main.js
    // So __dirname is dist-electron.
    // We compiled InputHelper.exe to electron/InputHelper.exe
    
    // Check multiple possible locations for robustness
    const possiblePaths = [
        path.join(__dirname, '../electron/InputHelper.exe'), // Dev: dist-electron/../electron/InputHelper.exe
        path.join(__dirname, 'InputHelper.exe'),             // Prod/Same dir
        path.join(process.cwd(), 'electron/InputHelper.exe') // Fallback
    ];

    let helperPath = possiblePaths.find(p => {
        return fs.existsSync(p);
    });

    if (!helperPath) {
        console.error("InputHelper.exe not found in:", possiblePaths);
        return;
    }

    console.log("Spawning InputHelper from:", helperPath);
    inputHelperProcess = spawn(helperPath);
    
    inputHelperProcess.stdout.on('data', (data: any) => {
        // console.log(`InputHelper: ${data}`);
    });

    inputHelperProcess.stderr.on('data', (data: any) => {
        console.error(`InputHelper Error: ${data}`);
    });
    
    inputHelperProcess.on('close', (code: any) => {
        console.log(`InputHelper exited with code ${code}`);
    });
}

function stopInputHelper() {
    if (inputHelperProcess) {
        inputHelperProcess.stdin.write("EXIT\n");
        inputHelperProcess.kill();
        inputHelperProcess = null;
    }
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  stopInputHelper();
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
    createWindow();
    startInputHelper();
    setupIpcHandlers();
    
    // Global shortcut to help users pick coordinates
    globalShortcut.register('CommandOrControl+Shift+I', () => {
         // In a real app, we would get cursor pos here. 
         // Since InputHelper is one-way, we might need a separate C# call or just use mouse_event to 'mark' spot?
         // For now, let's just notify the renderer.
         win?.webContents.send('global-shortcut', 'inspect-point');
    });
});

function setupIpcHandlers() {
    // --- System Control Handlers ---
    ipcMain.handle('system:getMousePos', async () => {
        if (!inputHelperProcess) return { success: false, error: "InputHelper not running" };
        
        return new Promise((resolve) => {
            const listener = (data: any) => {
                const str = data.toString().trim();
                if (str.startsWith("POS ")) {
                    inputHelperProcess.stdout.removeListener('data', listener);
                    const parts = str.split(" ");
                    resolve({ success: true, x: parseInt(parts[1]), y: parseInt(parts[2]) });
                } else if (str.startsWith("ERR ")) {
                    inputHelperProcess.stdout.removeListener('data', listener);
                    resolve({ success: false, error: str });
                }
            };
            inputHelperProcess.stdout.on('data', listener);
            inputHelperProcess.stdin.write("GET_POS\n");
            
            // Timeout safety
            setTimeout(() => {
                inputHelperProcess.stdout.removeListener('data', listener);
                // Don't resolve here to avoid double-resolve if late data comes, 
                // but strictly we should. For now rely on fast C# response.
            }, 1000);
        });
    });

    ipcMain.handle('system:mouseMove', async (_, x, y) => {
        if (inputHelperProcess) {
            inputHelperProcess.stdin.write(`MOVE ${x} ${y}\n`);
            return { success: true };
        }
        return { success: false, error: "InputHelper not running" };
    });

    ipcMain.handle('system:click', async (_, button = 0) => {
        if (inputHelperProcess) {
            inputHelperProcess.stdin.write(`CLICK ${button}\n`);
            return { success: true };
        }
        return { success: false, error: "InputHelper not running" };
    });

    ipcMain.handle('system:doubleClick', async () => {
        if (inputHelperProcess) {
            inputHelperProcess.stdin.write(`DOUBLECLICK\n`);
            return { success: true };
        }
        return { success: false, error: "InputHelper not running" };
    });

    ipcMain.handle('system:rightClick', async () => {
        if (inputHelperProcess) {
            inputHelperProcess.stdin.write(`RIGHTCLICK\n`);
            return { success: true };
        }
        return { success: false, error: "InputHelper not running" };
    });

    ipcMain.handle('system:drag', async (_, sx, sy, ex, ey) => {
        if (inputHelperProcess) {
            inputHelperProcess.stdin.write(`DRAG ${sx} ${sy} ${ex} ${ey}\n`);
            return { success: true };
        }
        return { success: false, error: "InputHelper not running" };
    });

    ipcMain.handle('system:type', async (_, text) => {
        if (inputHelperProcess) {
            inputHelperProcess.stdin.write(`TYPE ${text}\n`);
            return { success: true };
        }
        return { success: false, error: "InputHelper not running" };
    });

    ipcMain.handle('system:screenshot', async () => {
        try {
            const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
            // Get the first screen
            const source = sources[0];
            if (source) {
                return { success: true, data: source.thumbnail.toDataURL() };
            }
            return { success: false, error: "No screen source found" };
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    });

    // --- Legacy CDP Handlers (kept for compatibility if needed) ---
    ipcMain.handle('cdp:getTabs', async () => {
        return new Promise((resolve) => {
            // Try explicit host/port
            const options = { host: '127.0.0.1', port: 9222 };
            CDP.List(options, (err, targets) => {
                if (err) {
                    console.error('CDP List Error:', err);
                    resolve({ 
                        error: true, 
                        message: (err as Error).message,
                        details: "Ensure Chrome is completely closed before running with the flag."
                    });
                } else {
                    console.log('Targets found:', targets.length);
                    resolve(targets);
                }
            });
        });
    });

    ipcMain.handle('cdp:newTab', async () => {
        return new Promise((resolve) => {
            try {
                // create a new tab target
                // chrome-remote-interface exposes CDP.New
                // @ts-ignore
                CDP.New({ host: '127.0.0.1', port: 9222 }, (err: any, target: any) => {
                    if (err) {
                        resolve({ success: false, error: String(err) });
                    } else {
                        resolve({ success: true, targetId: target?.id || target?.targetId });
                    }
                });
            } catch (e: any) {
                resolve({ success: false, error: e?.message || String(e) });
            }
        });
    });

    ipcMain.handle('cdp:autoConnect', async () => {
        try {
            // list tabs
            const tabs: any = await new Promise((resolve) => {
                CDP.List({ host: '127.0.0.1', port: 9222 }, (err, targets) => {
                    if (err) resolve({ error: true, message: (err as Error).message });
                    else resolve(targets);
                });
            });

            let targetId: string | null = null;
            if (Array.isArray(tabs) && tabs.length > 0) {
                const page = tabs.find((t: any) => t.type === 'page') || tabs[0];
                targetId = page.id || page.targetId;
            } else {
                // Create a new tab via HTTP endpoint
                const created: any = await new Promise((resolve) => {
                    const req = http.get('http://127.0.0.1:9222/json/new?about:blank', (res) => {
                        let data = '';
                        res.on('data', (chunk) => data += chunk);
                        res.on('end', () => {
                            try {
                                const obj = JSON.parse(data);
                                resolve({ success: true, targetId: obj.id || obj.targetId });
                            } catch (e) {
                                resolve({ success: false, error: 'Create tab parse error' });
                            }
                        });
                    });
                    req.on('error', (e) => resolve({ success: false, error: e.message }));
                });
                if (created.success) targetId = created.targetId;
            }

            if (!targetId) {
                // As a last resort, try attaching without specifying a target
                try {
                    cdpClient = await CDP({ host: '127.0.0.1', port: 9222 });
                } catch (e) {
                    return { success: false, error: 'No target available' };
                }
            } else {
                if (cdpClient) {
                    await cdpClient.close();
                }
                cdpClient = await CDP({ target: targetId, host: '127.0.0.1', port: 9222 });
            }
            await cdpClient.Page.enable();
            await cdpClient.DOM.enable();
            await cdpClient.Runtime.enable();
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e?.message || String(e) };
        }
    });

    ipcMain.handle('cdp:checkConnection', async () => {
        return new Promise((resolve) => {
            const req = http.get('http://127.0.0.1:9222/json/version', (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve({ success: true, data: data }));
            });
            req.on('error', (e) => {
                resolve({ success: false, error: e.message });
            });
        });
    });

    ipcMain.handle('cdp:connect', async (_, targetId) => {
        try {
            if (cdpClient) {
                await cdpClient.close();
            }
            cdpClient = await CDP({ target: targetId, port: 9222 });
            await cdpClient.Page.enable();
            await cdpClient.DOM.enable();
            await cdpClient.Runtime.enable();
            return { success: true };
        } catch (error) {
            console.error('Failed to connect to tab:', error);
            return { success: false, error: (error as Error).message };
        }
    });

    ipcMain.handle('cdp:disconnect', async () => {
        if (cdpClient) {
            await cdpClient.close();
            cdpClient = null;
        }
        return { success: true };
    });

    ipcMain.handle('cdp:navigate', async (_, url) => {
        if (!cdpClient) return { success: false, error: "Not connected" };
        try {
            await cdpClient.Page.navigate({ url });
            await cdpClient.Page.loadEventFired();
            return { success: true };
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    });

    ipcMain.handle('cdp:click', async (_, selector) => {
        if (!cdpClient) return { success: false, error: "Not connected" };
        try {
            const { root: { nodeId: documentNodeId } } = await cdpClient.DOM.getDocument();
            const { nodeId } = await cdpClient.DOM.querySelector({
                nodeId: documentNodeId,
                selector: selector
            });
            
            if (!nodeId) throw new Error(`Element not found: ${selector}`);

            const { model } = await cdpClient.DOM.getBoxModel({ nodeId });
            const x = model.content[0] + (model.width / 2);
            const y = model.content[1] + (model.height / 2);

            await cdpClient.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
            await cdpClient.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
            
            return { success: true };
        } catch (e) {
             return { success: false, error: (e as Error).message };
        }
    });

    ipcMain.handle('cdp:type', async (_, selector, text) => {
        if (!cdpClient) return { success: false, error: "Not connected" };
        try {
             const { root: { nodeId: documentNodeId } } = await cdpClient.DOM.getDocument();
            const { nodeId } = await cdpClient.DOM.querySelector({
                nodeId: documentNodeId,
                selector: selector
            });
            
            if (!nodeId) throw new Error(`Element not found: ${selector}`);
            
            // Focus element (click it first)
            const { model } = await cdpClient.DOM.getBoxModel({ nodeId });
            const x = model.content[0] + (model.width / 2);
            const y = model.content[1] + (model.height / 2);

            await cdpClient.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
            await cdpClient.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });

            // Type text
             for (const char of text) {
                await cdpClient.Input.dispatchKeyEvent({ type: 'keyDown', text: char });
                await cdpClient.Input.dispatchKeyEvent({ type: 'keyUp' }); // Simple key up
            }

            return { success: true };
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    });
    
    ipcMain.handle('cdp:screenshot', async () => {
        if (!cdpClient) return { success: false, error: "Not connected" };
        try {
            const { data } = await cdpClient.Page.captureScreenshot();
            return { success: true, data };
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    });

     ipcMain.handle('cdp:evaluate', async (_, expression) => {
        if (!cdpClient) return { success: false, error: "Not connected" };
        try {
            const result = await cdpClient.Runtime.evaluate({ expression, returnByValue: true });
            return { success: true, result: result.result.value };
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    });

    // Launch Chrome with remote debugging if not already
    ipcMain.handle('system:launchChrome', async () => {
        try {
            const candidates = [
                'C:/Program Files/Google/Chrome/Application/chrome.exe',
                'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
            ];
            const exe = candidates.find(p => fs.existsSync(p));
            if (!exe) return { success: false, error: 'Chrome executable not found' };
            const tmpDir = app.getPath('temp');
            const userDataDir = path.join(tmpDir, 'cdp-profile-9222');
            try { if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true }); } catch {}
            const args = [
                '--remote-debugging-port=9222',
                `--user-data-dir=${userDataDir}`,
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-extensions'
            ];
            const child = spawn(exe, args, { detached: true, stdio: 'ignore' });
            child.unref();
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e?.message || String(e) };
        }
    });
}
