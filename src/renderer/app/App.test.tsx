import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';

function installDesktopApi() {
  const captureTabs = vi.fn(async () => ({
    capturedAt: '2026-08-29T03:00:00.000Z',
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
    ],
  }));
  const listArchives = vi.fn(async () => []);

  Object.defineProperty(window, 'desktop', {
    configurable: true,
    value: {
      archiveTabs: vi.fn(),
      captureTabs,
      deleteArchive: vi.fn(),
      getArchive: vi.fn(),
      getRuntimeInfo: vi.fn(),
      listArchives,
      restoreArchive: vi.fn(),
    },
  });

  return { captureTabs, listArchives };
}

describe('App', () => {
  it('split view에서 선택한 화면 제목을 표시한다', async () => {
    const { listArchives } = installDesktopApi();

    render(<App />);

    expect(screen.getByRole('complementary', { name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Views' })).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Tabs' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Archive' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Archive' })).toBeInTheDocument();
    await waitFor(() => {
      expect(listArchives).toHaveBeenCalledOnce();
    });
  });

  it('현재 탭과 보관함을 한 화면씩 전환한다', async () => {
    const { captureTabs, listArchives } = installDesktopApi();

    render(<App />);

    expect(screen.getByRole('tab', { name: 'Tabs' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Load Tabs' })).toBeInTheDocument();
    expect(document.querySelector('#tabs-panel')).not.toHaveAttribute('hidden');
    expect(document.querySelector('#archives-panel')).toHaveAttribute('hidden');
    expect(captureTabs).not.toHaveBeenCalled();
    expect(listArchives).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('tab', { name: 'Archive' }));

    await waitFor(() => {
      expect(listArchives).toHaveBeenCalledOnce();
    });
    expect(screen.getByRole('tab', { name: 'Archive' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('button', { name: 'Load Tabs' })).not.toBeInTheDocument();
  });

  it('화면을 왕복해도 현재 탭 상태를 유지한다', async () => {
    const { captureTabs } = installDesktopApi();

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Load Tabs' }));
    await screen.findByText('Electron 문서');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select StyleX 문서' }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search Tabs' }), {
      target: { value: 'Electron' },
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Archive' }));
    await screen.findByText('Archive is empty');
    fireEvent.click(screen.getByRole('tab', { name: 'Tabs' }));

    const search = screen.getByRole('searchbox', { name: 'Search Tabs' });
    expect(search).toHaveValue('Electron');
    fireEvent.change(search, { target: { value: '' } });
    expect(screen.getByRole('checkbox', { name: 'Select StyleX 문서' })).not.toBeChecked();
    expect(captureTabs).toHaveBeenCalledOnce();
  });

  it('방향키로 화면 탭을 전환한다', async () => {
    const { listArchives } = installDesktopApi();

    render(<App />);

    const currentTabs = screen.getByRole('tab', { name: 'Tabs' });
    currentTabs.focus();
    fireEvent.keyDown(currentTabs, { key: 'ArrowDown' });

    const archives = screen.getByRole('tab', { name: 'Archive' });
    expect(archives).toHaveFocus();
    expect(archives).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => {
      expect(listArchives).toHaveBeenCalledOnce();
    });

    fireEvent.keyDown(archives, { key: 'ArrowUp' });

    expect(currentTabs).toHaveFocus();
    expect(currentTabs).toHaveAttribute('aria-selected', 'true');
  });
});
