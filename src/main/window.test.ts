import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as windowModule from './window';

const { browserWindowMocks, existingWindow } = vi.hoisted(() => {
  const existing = {
    focus: vi.fn(),
    isMinimized: vi.fn(() => true),
    restore: vi.fn(),
    show: vi.fn(),
  };

  return {
    browserWindowMocks: {
      constructor: vi.fn(),
      getAllWindows: vi.fn(() => [existing]),
    },
    existingWindow: existing,
  };
});

vi.mock('electron', () => ({
  BrowserWindow: class {
    public static getAllWindows = browserWindowMocks.getAllWindows;
    public focus = vi.fn();
    public isMinimized = vi.fn(() => false);
    public loadURL = vi.fn();
    public once = vi.fn();
    public restore = vi.fn();
    public show = vi.fn();
    public webContents = {
      on: vi.fn(),
      setWindowOpenHandler: vi.fn(),
    };

    public constructor() {
      browserWindowMocks.constructor(this);
    }
  },
}));

type ShowMainWindow = () => {
  readonly focus: () => void;
  readonly restore: () => void;
  readonly show: () => void;
};

function getShowMainWindow(): ShowMainWindow {
  return (windowModule as typeof windowModule & { readonly showMainWindow: ShowMainWindow })
    .showMainWindow;
}

describe('showMainWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY', 'preload.js');
    vi.stubGlobal('MAIN_WINDOW_WEBPACK_ENTRY', 'http://localhost:3300');
    browserWindowMocks.getAllWindows.mockReturnValue([existingWindow]);
  });

  it('기존 창을 복원하고 앞으로 가져온다', () => {
    const window = getShowMainWindow()();

    expect(window).toBe(existingWindow);
    expect(existingWindow.restore).toHaveBeenCalledOnce();
    expect(existingWindow.show).toHaveBeenCalledOnce();
    expect(existingWindow.focus).toHaveBeenCalledOnce();
  });

  it('남은 창이 없으면 새 창을 만든다', () => {
    browserWindowMocks.getAllWindows.mockReturnValue([]);

    getShowMainWindow()();

    expect(browserWindowMocks.constructor).toHaveBeenCalledOnce();
  });
});
