import path from 'node:path';

import { app, BrowserWindow, dialog, session } from 'electron';

import { FileArchiveRepository } from './archive/archive-repository';
import { ArchiveService } from './archive/archive-service';
import { ChromeAppleEventsGateway } from './browser/chrome-apple-events';
import { executeJxa } from './browser/jxa-executor';
import { registerIpcHandlers } from './ipc';
import { createMainWindow } from './window';

app.enableSandbox();

async function bootstrap(): Promise<void> {
  await app.whenReady();

  if (!app.isPackaged && process.platform === 'darwin' && app.dock !== undefined) {
    app.dock.setIcon(path.join(app.getAppPath(), 'assets', 'wratop-icon.png'));
  }

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  const archiveDirectory = path.join(app.getPath('appData'), 'wratop', 'archives');
  const repository = new FileArchiveRepository(archiveDirectory);
  const browserGateway = new ChromeAppleEventsGateway(executeJxa);
  const archiveService = new ArchiveService(repository, browserGateway);

  registerIpcHandlers(MAIN_WINDOW_WEBPACK_ENTRY, archiveService);
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
  dialog.showErrorBox('Could not start Wratop', message);
  app.quit();
});
