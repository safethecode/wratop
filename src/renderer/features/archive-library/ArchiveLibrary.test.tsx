import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ArchiveLibrary } from './ArchiveLibrary';

const archiveId = '00000000-0000-4000-8000-000000000001';
const summary = {
  createdAt: '2026-08-29T03:00:00.000Z',
  id: archiveId,
  name: '개발 자료',
  tabCount: 2,
  windowCount: 1,
};
const archive = {
  ...summary,
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
};

function installDesktopApi() {
  const deleteArchive = vi.fn(async () => true);
  const getArchive = vi.fn(async () => archive);
  const listArchives = vi.fn(async () => [summary]);
  const restoreArchive = vi.fn(async () => ({ restoredTabCount: 1, windowCount: 1 }));

  Object.defineProperty(window, 'desktop', {
    configurable: true,
    value: { deleteArchive, getArchive, listArchives, restoreArchive },
  });

  return { deleteArchive, getArchive, listArchives, restoreArchive };
}

describe('ArchiveLibrary', () => {
  it('보관함 목록과 선택한 보관함 상세를 표시한다', async () => {
    const { getArchive, listArchives } = installDesktopApi();

    render(<ArchiveLibrary refreshKey={0} />);

    expect(await screen.findByRole('button', { name: /개발 자료/ })).toBeInTheDocument();
    expect(listArchives).toHaveBeenCalledOnce();
    expect(getArchive).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /개발 자료/ }));

    expect(await screen.findByText('Electron 문서')).toBeInTheDocument();
    expect(screen.getByText('StyleX 문서')).toBeInTheDocument();
    expect(getArchive).toHaveBeenCalledWith(archiveId);
  });

  it('보관함에서 선택한 탭만 복원한다', async () => {
    const { restoreArchive } = installDesktopApi();
    render(<ArchiveLibrary refreshKey={0} />);

    fireEvent.click(await screen.findByRole('button', { name: /개발 자료/ }));
    await screen.findByText('Electron 문서');
    fireEvent.click(screen.getByRole('checkbox', { name: 'StyleX 문서 선택' }));
    fireEvent.click(screen.getByRole('button', { name: '선택한 탭 복원' }));

    await waitFor(() => {
      expect(restoreArchive).toHaveBeenCalledWith({
        archiveId,
        selectedTabIds: ['tab-1'],
      });
    });
    expect(await screen.findByText('1개 탭을 1개 창으로 복원했습니다')).toBeInTheDocument();
  });

  it('확인한 보관함을 삭제하고 목록을 갱신한다', async () => {
    const { deleteArchive, listArchives } = installDesktopApi();
    listArchives.mockResolvedValueOnce([summary]).mockResolvedValueOnce([]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<ArchiveLibrary refreshKey={0} />);

    fireEvent.click(await screen.findByRole('button', { name: /개발 자료/ }));
    await screen.findByText('Electron 문서');
    fireEvent.click(screen.getByRole('button', { name: '보관함 삭제' }));

    await waitFor(() => {
      expect(deleteArchive).toHaveBeenCalledWith(archiveId);
    });
    expect(listArchives).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('아직 보관한 탭이 없습니다')).toBeInTheDocument();
  });
});
