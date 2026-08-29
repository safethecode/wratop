import { ipcMain } from 'electron';

import { IPC_CHANNELS } from '../shared/desktop-api';
import { createRuntimeInfo } from './runtime-info';
import { isTrustedSender } from './trusted-sender';

export function registerIpcHandlers(applicationUrl: string): void {
  ipcMain.handle(IPC_CHANNELS.getRuntimeInfo, (event) => {
    const senderUrl = event.senderFrame?.url;

    if (senderUrl === undefined || !isTrustedSender(senderUrl, applicationUrl)) {
      throw new Error('Untrusted IPC sender');
    }

    return createRuntimeInfo({
      platform: process.platform,
      versions: {
        chrome: process.versions.chrome,
        electron: process.versions.electron,
        node: process.versions.node,
      },
    });
  });
}
