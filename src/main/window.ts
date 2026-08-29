import { BrowserWindow } from 'electron';

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    backgroundColor: '#020617',
    height: 720,
    minHeight: 620,
    minWidth: 880,
    show: false,
    title: 'wratop',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      sandbox: true,
      webSecurity: true,
    },
    width: 1080,
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  void window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  return window;
}
