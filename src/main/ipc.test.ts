import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IPC_CHANNELS } from '../shared/desktop-api';
import { registerIpcHandlers } from './ipc';

interface TestIpcEvent {
  readonly senderFrame?: { readonly url: string };
}

type TestIpcHandler = (event: TestIpcEvent, value?: unknown) => unknown;

const { handlers } = vi.hoisted(() => ({
  handlers: new Map<string, TestIpcHandler>(),
}));

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: TestIpcHandler) => {
      handlers.set(channel, handler);
    },
  },
}));

function getHandler(channel: string): TestIpcHandler {
  const handler = handlers.get(channel);

  if (handler === undefined) {
    throw new Error(`Missing handler: ${channel}`);
  }

  return handler;
}

function createArchiveOperations() {
  return {
    archiveTabs: vi.fn(async () => ({
      archive: {
        createdAt: '2026-08-29T03:00:00.000Z',
        id: '00000000-0000-4000-8000-000000000001',
        name: '읽을 자료',
        tabCount: 1,
        windowCount: 1,
      },
      close: { status: 'not-requested' as const },
    })),
    captureTabs: vi.fn(async () => ({
      capturedAt: '2026-08-29T03:00:00.000Z',
      excludedIncognitoWindowCount: 0,
      source: 'chrome' as const,
      windows: [],
    })),
    deleteArchive: vi.fn(async () => true),
    getArchive: vi.fn(async () => null),
    listArchives: vi.fn(async () => []),
    restoreArchive: vi.fn(async () => ({ restoredTabCount: 1, windowCount: 1 })),
  };
}

describe('registerIpcHandlers', () => {
  beforeEach(() => {
    handlers.clear();
  });

  it('탭 보관 API를 service에 연결한다', async () => {
    const service = createArchiveOperations();
    const sender = { senderFrame: { url: 'http://localhost:3000/index.html' } };
    const archiveCommand = {
      closeAfterSave: false,
      name: '읽을 자료',
      selectedTabIds: ['tab-1'],
    };
    const archiveId = '00000000-0000-4000-8000-000000000001';
    const restoreCommand = { archiveId, selectedTabIds: ['tab-1'] };

    registerIpcHandlers('http://localhost:3000/index.html', service);

    await getHandler(IPC_CHANNELS.captureTabs)(sender);
    await getHandler(IPC_CHANNELS.archiveTabs)(sender, archiveCommand);
    await getHandler(IPC_CHANNELS.listArchives)(sender);
    await getHandler(IPC_CHANNELS.getArchive)(sender, archiveId);
    await getHandler(IPC_CHANNELS.deleteArchive)(sender, archiveId);
    await getHandler(IPC_CHANNELS.restoreArchive)(sender, restoreCommand);

    expect(service.captureTabs).toHaveBeenCalledOnce();
    expect(service.archiveTabs).toHaveBeenCalledWith(archiveCommand);
    expect(service.listArchives).toHaveBeenCalledOnce();
    expect(service.getArchive).toHaveBeenCalledWith(archiveId);
    expect(service.deleteArchive).toHaveBeenCalledWith(archiveId);
    expect(service.restoreArchive).toHaveBeenCalledWith(restoreCommand);
  });

  it('신뢰하지 않은 renderer 요청을 거부한다', async () => {
    const service = createArchiveOperations();

    registerIpcHandlers('http://localhost:3000/index.html', service);

    const request = getHandler(IPC_CHANNELS.captureTabs)({
      senderFrame: { url: 'https://attacker.example/' },
    });

    await expect(request).rejects.toThrow('Untrusted IPC sender');
    expect(service.captureTabs).not.toHaveBeenCalled();
  });
});
