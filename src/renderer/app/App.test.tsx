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
  it('현재 탭과 보관함을 한 화면씩 전환한다', async () => {
    const { captureTabs, listArchives } = installDesktopApi();

    render(<App />);

    expect(screen.getByRole('tab', { name: '현재 탭' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: '탭 불러오기' })).toBeInTheDocument();
    expect(document.querySelector('#tabs-panel')).not.toHaveAttribute('hidden');
    expect(document.querySelector('#archives-panel')).toHaveAttribute('hidden');
    expect(captureTabs).not.toHaveBeenCalled();
    expect(listArchives).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('tab', { name: '보관함' }));

    await waitFor(() => {
      expect(listArchives).toHaveBeenCalledOnce();
    });
    expect(screen.getByRole('tab', { name: '보관함' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('button', { name: '탭 불러오기' })).not.toBeInTheDocument();
  });

  it('화면을 왕복해도 현재 탭 상태를 유지한다', async () => {
    const { captureTabs } = installDesktopApi();

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '탭 불러오기' }));
    await screen.findByText('Electron 문서');
    fireEvent.click(screen.getByRole('checkbox', { name: 'StyleX 문서 선택' }));
    fireEvent.change(screen.getByRole('searchbox', { name: '탭 검색' }), {
      target: { value: 'Electron' },
    });

    fireEvent.click(screen.getByRole('tab', { name: '보관함' }));
    await screen.findByText('보관함이 비어 있습니다');
    fireEvent.click(screen.getByRole('tab', { name: '현재 탭' }));

    const search = screen.getByRole('searchbox', { name: '탭 검색' });
    expect(search).toHaveValue('Electron');
    fireEvent.change(search, { target: { value: '' } });
    expect(screen.getByRole('checkbox', { name: 'StyleX 문서 선택' })).not.toBeChecked();
    expect(captureTabs).toHaveBeenCalledOnce();
  });

  it('방향키로 화면 탭을 전환한다', async () => {
    const { listArchives } = installDesktopApi();

    render(<App />);

    const currentTabs = screen.getByRole('tab', { name: '현재 탭' });
    currentTabs.focus();
    fireEvent.keyDown(currentTabs, { key: 'ArrowRight' });

    const archives = screen.getByRole('tab', { name: '보관함' });
    expect(archives).toHaveFocus();
    expect(archives).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => {
      expect(listArchives).toHaveBeenCalledOnce();
    });

    fireEvent.keyDown(archives, { key: 'ArrowLeft' });

    expect(currentTabs).toHaveFocus();
    expect(currentTabs).toHaveAttribute('aria-selected', 'true');
  });
});
