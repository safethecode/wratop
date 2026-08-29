import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createStatusBar } from './status-bar';

interface TestMenuItem {
  readonly click?: () => void;
  readonly label?: string;
  readonly type?: string;
}

const { electronMocks } = vi.hoisted(() => ({
  electronMocks: {
    buildFromTemplate: vi.fn((template: readonly TestMenuItem[]) => ({ template })),
    createFromPath: vi.fn(() => ({ setTemplateImage: vi.fn() })),
    destroy: vi.fn(),
    setContextMenu: vi.fn(),
    setTitle: vi.fn(),
    setToolTip: vi.fn(),
  },
}));

vi.mock('electron', () => ({
  Menu: { buildFromTemplate: electronMocks.buildFromTemplate },
  Tray: class {
    public destroy = electronMocks.destroy;
    public setContextMenu = electronMocks.setContextMenu;
    public setTitle = electronMocks.setTitle;
    public setToolTip = electronMocks.setToolTip;
  },
  nativeImage: { createFromPath: electronMocks.createFromPath },
}));

const snapshot = {
  capturedAt: '2026-08-30T00:00:00.000Z',
  excludedIncognitoWindowCount: 0,
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
          url: 'https://electronjs.org',
        },
        {
          active: false,
          id: 'tab-2',
          position: 1,
          title: 'StyleX',
          url: 'https://stylexjs.com',
        },
      ],
    },
  ],
};

function getLatestMenu(): readonly TestMenuItem[] {
  const latestCall = electronMocks.buildFromTemplate.mock.lastCall;

  if (latestCall === undefined) {
    throw new Error('Status Bar 메뉴가 필요합니다.');
  }

  return latestCall[0];
}

function getMenuItem(label: string): TestMenuItem {
  const item = getLatestMenu().find((candidate) => candidate.label === label);

  if (item === undefined) {
    throw new Error(`${label} 메뉴가 필요합니다.`);
  }

  return item;
}

describe('createStatusBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('현재 Chrome 탭 수와 창 수를 표시한다', async () => {
    const statusBar = createStatusBar({
      captureTabs: async () => snapshot,
      iconPath: '/app/wratopStatusTemplate.png',
      openWindow: () => undefined,
      quit: () => undefined,
    });

    await statusBar.refresh();

    expect(getLatestMenu()[0]?.label).toBe('2 Tabs · 1 Window');
    expect(electronMocks.setTitle).toHaveBeenLastCalledWith('2', {
      fontType: 'monospacedDigit',
    });
    expect(electronMocks.setToolTip).toHaveBeenLastCalledWith('Wratop — 2 tabs');
    statusBar.destroy();
  });

  it('메뉴에서 Wratop을 열고 종료한다', () => {
    const openWindow = vi.fn();
    const quit = vi.fn();
    const statusBar = createStatusBar({
      captureTabs: async () => snapshot,
      iconPath: '/app/wratopStatusTemplate.png',
      openWindow,
      quit,
    });

    getMenuItem('View Wratop').click?.();
    getMenuItem('Quit Wratop').click?.();

    expect(openWindow).toHaveBeenCalledOnce();
    expect(quit).toHaveBeenCalledOnce();
    statusBar.destroy();
  });

  it('60초마다 갱신하되 진행 중인 요청은 겹치지 않는다', async () => {
    let completeCapture = (_value: typeof snapshot): void => {
      throw new Error('Chrome 확인 요청이 필요합니다.');
    };
    const captureTabs = vi.fn(
      () =>
        new Promise<typeof snapshot>((resolve) => {
          completeCapture = resolve;
        }),
    );
    const statusBar = createStatusBar({
      captureTabs,
      iconPath: '/app/wratopStatusTemplate.png',
      openWindow: () => undefined,
      quit: () => undefined,
    });

    await vi.advanceTimersByTimeAsync(180_000);

    expect(captureTabs).toHaveBeenCalledOnce();

    completeCapture(snapshot);
    await statusBar.refresh();
    statusBar.destroy();
  });
});
