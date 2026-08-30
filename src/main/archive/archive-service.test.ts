import { describe, expect, it } from 'vitest';

import { ArchiveService } from './archive-service';

const snapshot = {
  capturedAt: '2026-08-29T03:00:00.000Z',
  excludedIncognitoWindowCount: 1,
  source: 'chrome' as const,
  windows: [
    {
      id: 'window-1',
      position: 0,
      tabs: [
        {
          active: true,
          id: 'tab-1',
          position: 0,
          title: 'Electron',
          url: 'https://www.electronjs.org/',
        },
        {
          active: false,
          id: 'tab-2',
          position: 1,
          title: 'StyleX',
          url: 'https://stylexjs.com/',
        },
      ],
    },
  ],
};

describe('ArchiveService', () => {
  it('Chrome에서 확인한 탭에 지정한 순서를 적용한다', async () => {
    const service = new ArchiveService(
      {
        delete: async () => false,
        get: async () => null,
        list: async () => [],
        save: async () => undefined,
      },
      {
        captureTabs: async () => snapshot,
        closeTabs: async () => ({ closedTabCount: 0, skippedTabCount: 0 }),
        restoreWindows: async () => undefined,
      },
      {
        orderSnapshot: async (capturedSnapshot) => ({
          ...capturedSnapshot,
          windows: capturedSnapshot.windows.map((window) => ({
            ...window,
            tabs: [...window.tabs].reverse(),
          })),
        }),
      },
    );

    const capturedSnapshot = await service.captureTabs();

    expect(capturedSnapshot.windows[0]?.tabs.map((tab) => tab.id)).toEqual(['tab-2', 'tab-1']);
  });

  it('동시에 요청한 Chrome 탭 확인을 한 번만 실행한다', async () => {
    let captureCount = 0;
    let completeCapture = (_value: typeof snapshot): void => {
      throw new Error('Chrome 탭 확인 요청이 필요합니다.');
    };
    const service = new ArchiveService(
      {
        delete: async () => false,
        get: async () => null,
        list: async () => [],
        save: async () => undefined,
      },
      {
        captureTabs: () => {
          captureCount += 1;
          return new Promise((resolve) => {
            completeCapture = resolve;
          });
        },
        closeTabs: async () => ({ closedTabCount: 0, skippedTabCount: 0 }),
        restoreWindows: async () => undefined,
      },
    );

    const firstCapture = service.captureTabs();
    const secondCapture = service.captureTabs();

    expect(captureCount).toBe(1);
    completeCapture(snapshot);
    await expect(Promise.all([firstCapture, secondCapture])).resolves.toEqual([snapshot, snapshot]);

    const nextCapture = service.captureTabs();
    expect(captureCount).toBe(2);
    completeCapture(snapshot);
    await expect(nextCapture).resolves.toEqual(snapshot);
  });

  it('선택한 탭을 저장한 다음 Chrome에서 닫는다', async () => {
    const events: string[] = [];
    const savedArchives: unknown[] = [];
    const closeTargets: unknown[] = [];
    const repository = {
      delete: async () => false,
      get: async () => null,
      list: async () => [],
      save: async (archive: unknown) => {
        await Promise.resolve();
        events.push('save');
        savedArchives.push(archive);
      },
    };
    const browserGateway = {
      captureTabs: async () => snapshot,
      closeTabs: async (targets: readonly unknown[]) => {
        events.push('close');
        closeTargets.push(...targets);
        return { closedTabCount: 1, skippedTabCount: 0 };
      },
      restoreWindows: async () => undefined,
    };
    const service = new ArchiveService(repository, browserGateway, {
      createId: () => '00000000-0000-4000-8000-000000000010',
      now: () => new Date('2026-08-29T03:01:00.000Z'),
    });

    const result = await service.archiveTabs({
      closeAfterSave: true,
      name: '구현 참고자료',
      selectedTabIds: ['tab-2'],
    });

    expect(events).toEqual(['save', 'close']);
    expect(savedArchives).toEqual([
      {
        createdAt: '2026-08-29T03:01:00.000Z',
        id: '00000000-0000-4000-8000-000000000010',
        name: '구현 참고자료',
        source: 'chrome',
        windows: [
          {
            id: 'window-1',
            position: 0,
            tabs: [snapshot.windows[0]?.tabs[1]],
          },
        ],
      },
    ]);
    expect(closeTargets).toEqual([
      {
        expectedUrl: 'https://stylexjs.com/',
        tabId: 'tab-2',
        windowId: 'window-1',
      },
    ]);
    expect(result).toEqual({
      archive: {
        createdAt: '2026-08-29T03:01:00.000Z',
        id: '00000000-0000-4000-8000-000000000010',
        name: '구현 참고자료',
        tabCount: 1,
        windowCount: 1,
      },
      close: { closedTabCount: 1, skippedTabCount: 0, status: 'completed' },
    });
  });

  it('보관만 요청하면 Chrome 탭을 닫지 않는다', async () => {
    let closeCount = 0;
    const service = new ArchiveService(
      {
        delete: async () => false,
        get: async () => null,
        list: async () => [],
        save: async () => undefined,
      },
      {
        captureTabs: async () => snapshot,
        closeTabs: async () => {
          closeCount += 1;
          return { closedTabCount: 0, skippedTabCount: 0 };
        },
        restoreWindows: async () => undefined,
      },
      {
        createId: () => '00000000-0000-4000-8000-000000000011',
        now: () => new Date('2026-08-29T03:02:00.000Z'),
      },
    );

    const result = await service.archiveTabs({
      closeAfterSave: false,
      name: '',
      selectedTabIds: ['tab-1'],
    });

    expect(closeCount).toBe(0);
    expect(result.close).toEqual({ status: 'not-requested' });
    expect(result.archive.name).toBe('2026-08-29 Chrome Tabs');
  });

  it('탭 닫기가 실패해도 저장된 아카이브 정보를 반환한다', async () => {
    const service = new ArchiveService(
      {
        delete: async () => false,
        get: async () => null,
        list: async () => [],
        save: async () => undefined,
      },
      {
        captureTabs: async () => snapshot,
        closeTabs: async () => Promise.reject(new Error('Chrome automation denied')),
        restoreWindows: async () => undefined,
      },
      {
        createId: () => '00000000-0000-4000-8000-000000000012',
        now: () => new Date('2026-08-29T03:03:00.000Z'),
      },
    );

    const result = await service.archiveTabs({
      closeAfterSave: true,
      name: '권한 전 보관',
      selectedTabIds: ['tab-1'],
    });

    expect(result.close).toEqual({ message: 'Chrome automation denied', status: 'failed' });
    expect(result.archive.name).toBe('권한 전 보관');
  });

  it('보관함에서 선택한 탭만 원래 창 단위로 복원한다', async () => {
    const restoredWindows: unknown[] = [];
    const service = new ArchiveService(
      {
        delete: async () => false,
        get: async () => ({
          createdAt: '2026-08-29T03:00:00.000Z',
          id: '00000000-0000-4000-8000-000000000013',
          name: '복원할 탭',
          source: 'chrome',
          windows: snapshot.windows,
        }),
        list: async () => [],
        save: async () => undefined,
      },
      {
        captureTabs: async () => snapshot,
        closeTabs: async () => ({ closedTabCount: 0, skippedTabCount: 0 }),
        restoreWindows: async (windows: readonly unknown[]) => {
          restoredWindows.push(...windows);
        },
      },
    );

    const result = await service.restoreArchive({
      archiveId: '00000000-0000-4000-8000-000000000013',
      selectedTabIds: ['tab-2'],
    });

    expect(restoredWindows).toEqual([
      {
        id: 'window-1',
        position: 0,
        tabs: [snapshot.windows[0]?.tabs[1]],
      },
    ]);
    expect(result).toEqual({ restoredTabCount: 1, windowCount: 1 });
  });
});
