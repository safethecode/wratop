import type { IpcMainInvokeEvent } from 'electron';
import { ipcMain } from 'electron';

import type {
  ArchiveTabsCommand,
  ArchiveTabsResult,
  BrowserSnapshot,
  RestoreArchiveCommand,
  RestoreArchiveResult,
  TabArchive,
  TabArchiveSummary,
} from '../shared/archive';
import { IPC_CHANNELS } from '../shared/desktop-api';
import {
  parseArchiveId,
  parseArchiveTabsCommand,
  parseRestoreArchiveCommand,
} from './ipc/archive-commands';
import { createRuntimeInfo } from './runtime-info';
import { isTrustedSender } from './trusted-sender';

export interface ArchiveOperations {
  archiveTabs(command: ArchiveTabsCommand): Promise<ArchiveTabsResult>;
  captureTabs(): Promise<BrowserSnapshot>;
  deleteArchive(id: string): Promise<boolean>;
  getArchive(id: string): Promise<TabArchive | null>;
  listArchives(): Promise<readonly TabArchiveSummary[]>;
  restoreArchive(command: RestoreArchiveCommand): Promise<RestoreArchiveResult>;
}

function assertTrustedSender(event: IpcMainInvokeEvent, applicationUrl: string): void {
  const senderUrl = event.senderFrame?.url;

  if (senderUrl === undefined || !isTrustedSender(senderUrl, applicationUrl)) {
    throw new Error('Untrusted IPC sender');
  }
}

export function registerIpcHandlers(
  applicationUrl: string,
  archiveOperations: ArchiveOperations,
): void {
  ipcMain.handle(IPC_CHANNELS.getRuntimeInfo, (event) => {
    assertTrustedSender(event, applicationUrl);

    return createRuntimeInfo({
      platform: process.platform,
      versions: {
        chrome: process.versions.chrome,
        electron: process.versions.electron,
        node: process.versions.node,
      },
    });
  });

  ipcMain.handle(IPC_CHANNELS.captureTabs, async (event) => {
    assertTrustedSender(event, applicationUrl);
    return archiveOperations.captureTabs();
  });

  ipcMain.handle(IPC_CHANNELS.archiveTabs, async (event, command: unknown) => {
    assertTrustedSender(event, applicationUrl);
    return archiveOperations.archiveTabs(parseArchiveTabsCommand(command));
  });

  ipcMain.handle(IPC_CHANNELS.listArchives, async (event) => {
    assertTrustedSender(event, applicationUrl);
    return archiveOperations.listArchives();
  });

  ipcMain.handle(IPC_CHANNELS.getArchive, async (event, id: unknown) => {
    assertTrustedSender(event, applicationUrl);
    return archiveOperations.getArchive(parseArchiveId(id));
  });

  ipcMain.handle(IPC_CHANNELS.deleteArchive, async (event, id: unknown) => {
    assertTrustedSender(event, applicationUrl);
    return archiveOperations.deleteArchive(parseArchiveId(id));
  });

  ipcMain.handle(IPC_CHANNELS.restoreArchive, async (event, command: unknown) => {
    assertTrustedSender(event, applicationUrl);
    return archiveOperations.restoreArchive(parseRestoreArchiveCommand(command));
  });
}
