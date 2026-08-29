import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CurrentTabsPanel } from './CurrentTabsPanel';

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
          title: 'Electron 문서',
          url: 'https://www.electronjs.org/docs',
        },
        {
          active: false,
          id: 'tab-2',
          position: 1,
          title: 'StyleX 문서',
          url: 'https://stylexjs.com/docs',
        },
      ],
    },
    {
      id: 'window-2',
      position: 1,
      tabs: [
        {
          active: true,
          id: 'tab-3',
          position: 0,
          title: 'Electron API',
          url: 'https://www.electronjs.org/docs',
        },
      ],
    },
  ],
};

function installDesktopApi() {
  const archiveTabs = vi.fn(async () => ({
    archive: {
      createdAt: '2026-08-29T03:01:00.000Z',
      id: '00000000-0000-4000-8000-000000000001',
      name: '개발 자료',
      tabCount: 2,
      windowCount: 2,
    },
    close: { status: 'not-requested' as const },
  }));
  const captureTabs = vi.fn(async () => snapshot);
  const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  const visibilityState = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');

  Object.defineProperty(window, 'desktop', {
    configurable: true,
    value: {
      archiveTabs,
      captureTabs,
    },
  });

  return { archiveTabs, captureTabs, hasFocus, visibilityState };
}

describe('CurrentTabsPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('화면이 열리면 Chrome 탭을 바로 불러온다', async () => {
    const { captureTabs } = installDesktopApi();

    render(<CurrentTabsPanel isActive onArchiveCreated={() => undefined} />);

    expect(await screen.findByText('Electron 문서')).toBeInTheDocument();
    expect(captureTabs).toHaveBeenCalledOnce();
    expect(screen.getByRole('checkbox', { name: 'Select Electron 문서' })).toBeChecked();
  });

  it('처음부터 포커스가 없으면 확인하지 않고 포커스될 때 불러온다', async () => {
    const { captureTabs, hasFocus } = installDesktopApi();
    hasFocus.mockReturnValue(false);

    render(<CurrentTabsPanel isActive onArchiveCreated={() => undefined} />);
    await act(async () => undefined);

    expect(captureTabs).not.toHaveBeenCalled();

    hasFocus.mockReturnValue(true);
    fireEvent.focus(window);

    expect(await screen.findByText('Electron 문서')).toBeInTheDocument();
    expect(captureTabs).toHaveBeenCalledOnce();
  });

  it('같은 목록을 수동으로 새로고침해도 탭 목록을 유지한다', async () => {
    const { captureTabs } = installDesktopApi();

    render(<CurrentTabsPanel isActive onArchiveCreated={() => undefined} />);

    await screen.findByText('Electron 문서');
    fireEvent.click(screen.getByRole('button', { name: 'Reload Tabs' }));

    expect(await screen.findByText('Electron 문서')).toBeInTheDocument();
    expect(captureTabs).toHaveBeenCalledTimes(2);
  });

  it('Chrome 탭을 창별로 표시한다', async () => {
    installDesktopApi();
    render(<CurrentTabsPanel isActive onArchiveCreated={() => undefined} />);

    expect(await screen.findByText('Electron 문서')).toBeInTheDocument();
    expect(screen.getByText('StyleX 문서')).toBeInTheDocument();
    expect(screen.getByText('Electron API')).toBeInTheDocument();
    expect(screen.getByText('Window 1')).toBeInTheDocument();
    expect(screen.getByText('Window 2')).toBeInTheDocument();
    expect(screen.getByText('1 incognito window excluded')).toBeInTheDocument();
  });

  it('제목 없는 탭에 읽을 수 있는 선택 이름을 붙인다', async () => {
    const { captureTabs } = installDesktopApi();
    captureTabs.mockResolvedValueOnce({
      ...snapshot,
      windows: [
        {
          id: 'window-untitled',
          position: 0,
          tabs: [
            {
              active: true,
              id: 'tab-untitled',
              position: 0,
              title: '',
              url: 'https://www.electronjs.org/docs',
            },
          ],
        },
      ],
    });
    render(<CurrentTabsPanel isActive onArchiveCreated={() => undefined} />);

    expect(
      await screen.findByRole('checkbox', { name: 'Select Untitled Tab' }),
    ).toBeInTheDocument();
  });

  it('선택한 탭만 이름을 붙여 보관한다', async () => {
    const onArchiveCreated = vi.fn();
    const { archiveTabs } = installDesktopApi();
    render(<CurrentTabsPanel isActive onArchiveCreated={onArchiveCreated} />);

    await screen.findByText('Electron 문서');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select StyleX 문서' }));
    fireEvent.change(screen.getByLabelText('Archive Name'), { target: { value: '개발 자료' } });
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));

    await waitFor(() => {
      expect(archiveTabs).toHaveBeenCalledWith({
        closeAfterSave: false,
        name: '개발 자료',
        selectedTabIds: ['tab-1', 'tab-3'],
      });
    });
    expect(onArchiveCreated).toHaveBeenCalledWith(
      expect.objectContaining({ id: '00000000-0000-4000-8000-000000000001' }),
    );
    expect(await screen.findByText('Archived 2 tabs')).toBeInTheDocument();
  });

  it('활성 상태에서는 15초 뒤 새 탭을 목록에 반영한다', async () => {
    vi.useFakeTimers();
    const { captureTabs } = installDesktopApi();
    const [firstWindow, secondWindow] = snapshot.windows;

    if (firstWindow === undefined || secondWindow === undefined) {
      throw new Error('테스트 창 fixture가 필요합니다.');
    }

    captureTabs.mockResolvedValueOnce(snapshot).mockResolvedValueOnce({
      ...snapshot,
      capturedAt: '2026-08-29T03:00:15.000Z',
      windows: [
        {
          ...firstWindow,
          tabs: [
            ...firstWindow.tabs,
            {
              active: false,
              id: 'tab-4',
              position: 2,
              title: 'New Tab',
              url: 'https://example.com/new',
            },
          ],
        },
        secondWindow,
      ],
    });

    render(<CurrentTabsPanel isActive onArchiveCreated={() => undefined} />);
    await act(async () => undefined);

    expect(screen.queryByText('New Tab')).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(screen.getByText('New Tab')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select New Tab' })).not.toBeChecked();
  });

  it('Chrome 확인이 끝나기 전에는 다음 확인을 시작하지 않는다', async () => {
    vi.useFakeTimers();
    const { captureTabs } = installDesktopApi();
    let completeCapture = (_value: typeof snapshot): void => {
      throw new Error('Chrome 확인 요청이 필요합니다.');
    };
    captureTabs.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          completeCapture = resolve;
        }),
    );

    render(<CurrentTabsPanel isActive onArchiveCreated={() => undefined} />);
    await act(async () => undefined);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(45_000);
    });

    expect(captureTabs).toHaveBeenCalledOnce();

    await act(async () => {
      completeCapture(snapshot);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(captureTabs).toHaveBeenCalledTimes(2);
  });

  it('자동 확인 중 요청한 수동 새로고침을 이어서 실행한다', async () => {
    vi.useFakeTimers();
    const { captureTabs } = installDesktopApi();
    let completeAutoCapture = (_value: typeof snapshot): void => {
      throw new Error('자동 확인 요청이 필요합니다.');
    };
    captureTabs
      .mockResolvedValueOnce(snapshot)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            completeAutoCapture = resolve;
          }),
      )
      .mockResolvedValueOnce(snapshot);

    render(<CurrentTabsPanel isActive onArchiveCreated={() => undefined} />);
    await act(async () => undefined);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select StyleX 문서' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reload Tabs' }));

    expect(screen.getByText('Loading…')).toBeInTheDocument();

    await act(async () => {
      completeAutoCapture(snapshot);
    });

    expect(captureTabs).toHaveBeenCalledTimes(3);
    expect(screen.getByText('Electron 문서')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select StyleX 문서' })).toBeChecked();
  });

  it('백그라운드에서는 확인을 멈추고 다시 활성화되면 즉시 갱신한다', async () => {
    vi.useFakeTimers();
    const { captureTabs } = installDesktopApi();

    render(<CurrentTabsPanel isActive onArchiveCreated={() => undefined} />);
    await act(async () => undefined);
    fireEvent.blur(window);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(45_000);
    });

    expect(captureTabs).toHaveBeenCalledOnce();

    fireEvent.focus(window);
    await act(async () => undefined);

    expect(captureTabs).toHaveBeenCalledTimes(2);
  });

  it('문서가 가려진 동안 확인을 멈추고 보이면 즉시 갱신한다', async () => {
    vi.useFakeTimers();
    const { captureTabs, visibilityState } = installDesktopApi();

    render(<CurrentTabsPanel isActive onArchiveCreated={() => undefined} />);
    await act(async () => undefined);
    visibilityState.mockReturnValue('hidden');
    fireEvent(document, new Event('visibilitychange'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(45_000);
    });

    expect(captureTabs).toHaveBeenCalledOnce();

    visibilityState.mockReturnValue('visible');
    fireEvent(document, new Event('visibilitychange'));
    await act(async () => undefined);

    expect(captureTabs).toHaveBeenCalledTimes(2);
  });

  it('다른 화면을 보는 동안 확인을 멈추고 돌아오면 즉시 갱신한다', async () => {
    vi.useFakeTimers();
    const { captureTabs } = installDesktopApi();
    const { rerender } = render(<CurrentTabsPanel isActive onArchiveCreated={() => undefined} />);
    await act(async () => undefined);

    rerender(<CurrentTabsPanel isActive={false} onArchiveCreated={() => undefined} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(45_000);
    });

    expect(captureTabs).toHaveBeenCalledOnce();

    rerender(<CurrentTabsPanel isActive onArchiveCreated={() => undefined} />);
    await act(async () => undefined);

    expect(captureTabs).toHaveBeenCalledTimes(2);
  });

  it('다른 화면을 다녀온 사이의 오래된 응답을 버리고 다시 확인한다', async () => {
    const { captureTabs } = installDesktopApi();
    let completeCapture = (_value: typeof snapshot): void => {
      throw new Error('Chrome 확인 요청이 필요합니다.');
    };
    captureTabs.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          completeCapture = resolve;
        }),
    );
    const { rerender } = render(<CurrentTabsPanel isActive onArchiveCreated={() => undefined} />);
    await act(async () => undefined);

    rerender(<CurrentTabsPanel isActive={false} onArchiveCreated={() => undefined} />);
    rerender(<CurrentTabsPanel isActive onArchiveCreated={() => undefined} />);
    await act(async () => undefined);

    expect(captureTabs).toHaveBeenCalledOnce();

    await act(async () => {
      completeCapture(snapshot);
    });

    await waitFor(() => {
      expect(captureTabs).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText('Electron 문서')).toBeInTheDocument();
  });
});
