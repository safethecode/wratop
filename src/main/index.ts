import { app, BrowserWindow, dialog, session } from 'electron';

import { registerIpcHandlers } from './ipc';
import { createMainWindow } from './window';

app.enableSandbox();

async function bootstrap(): Promise<void> {
  await app.whenReady();

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  registerIpcHandlers(MAIN_WINDOW_WEBPACK_ENTRY);
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  dialog.showErrorBox('wratop을 시작하지 못했습니다', message);
  app.quit();
});
