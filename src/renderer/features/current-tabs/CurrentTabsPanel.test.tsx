import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

  Object.defineProperty(window, 'desktop', {
    configurable: true,
    value: {
      archiveTabs,
      captureTabs,
    },
  });

  return { archiveTabs, captureTabs };
}

describe('CurrentTabsPanel', () => {
  it('사용자가 요청하기 전에는 Chrome 탭을 읽지 않는다', () => {
    const { captureTabs } = installDesktopApi();

    render(<CurrentTabsPanel onArchiveCreated={() => undefined} />);

    expect(captureTabs).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Load Tabs' })).toBeInTheDocument();
  });

  it('Chrome 탭을 창별로 표시한다', async () => {
    installDesktopApi();
    render(<CurrentTabsPanel onArchiveCreated={() => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: 'Load Tabs' }));

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
    render(<CurrentTabsPanel onArchiveCreated={() => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: 'Load Tabs' }));

    expect(
      await screen.findByRole('checkbox', { name: 'Select Untitled Tab' }),
    ).toBeInTheDocument();
  });

  it('선택한 탭만 이름을 붙여 보관한다', async () => {
    const onArchiveCreated = vi.fn();
    const { archiveTabs } = installDesktopApi();
    render(<CurrentTabsPanel onArchiveCreated={onArchiveCreated} />);

    fireEvent.click(screen.getByRole('button', { name: 'Load Tabs' }));
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
});
