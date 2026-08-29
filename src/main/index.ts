import path from 'node:path';

import { app, dialog, session } from 'electron';

import { resolveAppAssetPath } from './app-assets';
import { FileArchiveRepository } from './archive/archive-repository';
import { ArchiveService } from './archive/archive-service';
import { ChromeAppleEventsGateway } from './browser/chrome-apple-events';
import { executeJxa } from './browser/jxa-executor';
import { registerIpcHandlers } from './ipc';
import type { StatusBar } from './status-bar';
import { createStatusBar } from './status-bar';
import { showMainWindow } from './window';

app.enableSandbox();

let statusBar: StatusBar | null = null;

async function bootstrap(): Promise<void> {
  await app.whenReady();
  const assetRuntime = {
    appPath: app.getAppPath(),
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
  };

  if (!app.isPackaged && process.platform === 'darwin' && app.dock !== undefined) {
    app.dock.setIcon(resolveAppAssetPath('wratop-icon.png', assetRuntime));
  }

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  const archiveDirectory = path.join(app.getPath('appData'), 'wratop', 'archives');
  const repository = new FileArchiveRepository(archiveDirectory);
  const browserGateway = new ChromeAppleEventsGateway(executeJxa);
  const archiveService = new ArchiveService(repository, browserGateway);

  registerIpcHandlers(MAIN_WINDOW_WEBPACK_ENTRY, archiveService);
  showMainWindow();
  statusBar = createStatusBar({
    captureTabs: () => archiveService.captureTabs(),
    iconPath: resolveAppAssetPath('wratopStatusTemplate.png', assetRuntime),
    openWindow: () => {
      app.focus({ steal: true });
      showMainWindow();
    },
    quit: () => app.quit(),
  });

  app.on('activate', () => {
    showMainWindow();
  });

  app.on('before-quit', () => {
    statusBar?.destroy();
    statusBar = null;
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
