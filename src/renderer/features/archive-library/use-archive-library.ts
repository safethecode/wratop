import { useEffect, useState } from 'react';

import type { TabArchive, TabArchiveSummary } from '../../../shared/archive';

export type ArchiveListState =
  | { readonly status: 'loading' }
  | { readonly message: string; readonly status: 'error' }
  | { readonly archives: readonly TabArchiveSummary[]; readonly status: 'ready' };

export type ArchiveDetailState =
  | { readonly status: 'closed' }
  | { readonly status: 'loading' }
  | { readonly message: string; readonly status: 'error' }
  | { readonly archive: TabArchive; readonly status: 'ready' };

export interface ArchiveLibraryModel {
  readonly closeArchive: () => void;
  readonly deleteCurrentArchive: () => Promise<void>;
  readonly detailState: ArchiveDetailState;
  readonly feedback: string | null;
  readonly isBusy: boolean;
  readonly listState: ArchiveListState;
  readonly openArchive: (archiveId: string) => Promise<void>;
  readonly restoreSelectedTabs: () => Promise<void>;
  readonly selectedTabIds: ReadonlySet<string>;
  readonly toggleAllTabs: () => void;
  readonly toggleTab: (tabId: string) => void;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
}

function getTabIds(archive: TabArchive): readonly string[] {
  return archive.windows.flatMap((window) => window.tabs.map((tab) => tab.id));
}

export function useArchiveLibrary(refreshKey: number): ArchiveLibraryModel {
  const [detailState, setDetailState] = useState<ArchiveDetailState>({ status: 'closed' });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [listState, setListState] = useState<ArchiveListState>({ status: 'loading' });
  const [selectedTabIds, setSelectedTabIds] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    void refreshKey;
    let isCurrent = true;
    setListState({ status: 'loading' });

    window.desktop.listArchives().then(
      (archives) => {
        if (isCurrent) {
          setListState({ archives, status: 'ready' });
        }
      },
      (error: unknown) => {
        if (isCurrent) {
          setListState({ message: getErrorMessage(error), status: 'error' });
        }
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  const openArchive = async (archiveId: string): Promise<void> => {
    setDetailState({ status: 'loading' });
    setFeedback(null);

    try {
      const archive = await window.desktop.getArchive(archiveId);

      if (archive === null) {
        setDetailState({ message: '보관함을 찾지 못했습니다', status: 'error' });
        return;
      }

      setDetailState({ archive, status: 'ready' });
      setSelectedTabIds(new Set(getTabIds(archive)));
    } catch (error: unknown) {
      setDetailState({ message: getErrorMessage(error), status: 'error' });
    }
  };

  const closeArchive = (): void => {
    setDetailState({ status: 'closed' });
    setFeedback(null);
    setSelectedTabIds(new Set());
  };

  const toggleTab = (tabId: string): void => {
    setSelectedTabIds((current) => {
      const next = new Set(current);

      if (next.has(tabId)) {
        next.delete(tabId);
      } else {
        next.add(tabId);
      }

      return next;
    });
  };

  const toggleAllTabs = (): void => {
    if (detailState.status !== 'ready') {
      return;
    }

    const tabIds = getTabIds(detailState.archive);
    const allSelected = tabIds.every((tabId) => selectedTabIds.has(tabId));
    setSelectedTabIds(allSelected ? new Set() : new Set(tabIds));
  };

  const restoreSelectedTabs = async (): Promise<void> => {
    if (detailState.status !== 'ready' || selectedTabIds.size === 0 || isBusy) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const result = await window.desktop.restoreArchive({
        archiveId: detailState.archive.id,
        selectedTabIds: getTabIds(detailState.archive).filter((tabId) => selectedTabIds.has(tabId)),
      });
      setFeedback(`${result.restoredTabCount}개 탭을 ${result.windowCount}개 창으로 복원했습니다`);
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const deleteCurrentArchive = async (): Promise<void> => {
    if (detailState.status !== 'ready' || isBusy) {
      return;
    }

    if (!window.confirm(`“${detailState.archive.name}” 보관함을 삭제할까요?`)) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      await window.desktop.deleteArchive(detailState.archive.id);
      const archives = await window.desktop.listArchives();
      setListState({ archives, status: 'ready' });
      setDetailState({ status: 'closed' });
      setSelectedTabIds(new Set());
    } catch (error: unknown) {
      setFeedback(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  return {
    closeArchive,
    deleteCurrentArchive,
    detailState,
    feedback,
    isBusy,
    listState,
    openArchive,
    restoreSelectedTabs,
    selectedTabIds,
    toggleAllTabs,
    toggleTab,
  };
}
