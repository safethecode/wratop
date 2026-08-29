import { BrowserWindow } from 'electron';

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    backgroundColor: '#18181b',
    height: 720,
    minHeight: 560,
    minWidth: 420,
    show: false,
    title: 'Wratop',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      sandbox: true,
      webSecurity: true,
    },
    width: 512,
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

export function showMainWindow(): BrowserWindow {
  const [existingWindow] = BrowserWindow.getAllWindows();

  if (existingWindow === undefined) {
    return createMainWindow();
  }

  if (existingWindow.isMinimized()) {
    existingWindow.restore();
  }

  existingWindow.show();
  existingWindow.focus();

  return existingWindow;
}
