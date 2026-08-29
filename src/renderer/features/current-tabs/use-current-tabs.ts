import { useDeferredValue, useMemo, useState } from 'react';

import type {
  ArchiveTabsResult,
  BrowserSnapshot,
  BrowserWindow,
  TabArchiveSummary,
} from '../../../shared/archive';

export type CaptureState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly message: string; readonly status: 'error' }
  | { readonly snapshot: BrowserSnapshot; readonly status: 'ready' };

export interface Feedback {
  readonly message: string;
  readonly tone: 'error' | 'success' | 'warning';
}

interface UseCurrentTabsOptions {
  readonly onArchiveCreated: (archive: TabArchiveSummary) => void;
}

export interface CurrentTabsModel {
  readonly allVisibleSelected: boolean;
  readonly archiveSelectedTabs: (closeAfterSave: boolean) => Promise<void>;
  readonly captureState: CaptureState;
  readonly feedback: Feedback | null;
  readonly filteredWindows: readonly BrowserWindow[];
  readonly isSaving: boolean;
  readonly loadTabs: () => Promise<void>;
  readonly name: string;
  readonly searchQuery: string;
  readonly selectedTabIds: ReadonlySet<string>;
  readonly setName: (name: string) => void;
  readonly setSearchQuery: (query: string) => void;
  readonly snapshot: BrowserSnapshot | null;
  readonly toggleTab: (tabId: string) => void;
  readonly toggleVisibleTabs: () => void;
}

export function getTabIds(windows: readonly BrowserWindow[]): readonly string[] {
  return windows.flatMap((window) => window.tabs.map((tab) => tab.id));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}

function filterWindows(
  windows: readonly BrowserWindow[],
  searchQuery: string,
): readonly BrowserWindow[] {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('ko-KR');

  if (normalizedQuery.length === 0) {
    return windows;
  }

  return windows.flatMap((window) => {
    const tabs = window.tabs.filter((tab) =>
      `${tab.title}\n${tab.url}`.toLocaleLowerCase('ko-KR').includes(normalizedQuery),
    );

    return tabs.length > 0 ? [{ ...window, tabs }] : [];
  });
}

function createArchiveFeedback(result: ArchiveTabsResult): Feedback {
  const archivedTabs = `${result.archive.tabCount} ${result.archive.tabCount === 1 ? 'tab' : 'tabs'}`;

  if (result.close.status === 'failed') {
    return {
      message: `Archived ${archivedTabs}, but could not close them in Chrome. ${result.close.message}`,
      tone: 'warning',
    };
  }

  if (result.close.status === 'completed' && result.close.skippedTabCount > 0) {
    const skippedTabs = `${result.close.skippedTabCount} ${result.close.skippedTabCount === 1 ? 'tab' : 'tabs'}`;

    return {
      message: `Archived ${archivedTabs}. Left ${skippedTabs} open because they moved.`,
      tone: 'warning',
    };
  }

  return {
    message: `Archived ${archivedTabs}`,
    tone: 'success',
  };
}

async function refreshAfterClose(
  result: ArchiveTabsResult,
  setCaptureState: (state: CaptureState) => void,
): Promise<void> {
  if (result.close.status !== 'completed') {
    return;
  }

  try {
    const snapshot = await window.desktop.captureTabs();
    setCaptureState({ snapshot, status: 'ready' });
  } catch {
    // Keep the archive result visible and let the user reload the tabs.
  }
}

export function useCurrentTabs({ onArchiveCreated }: UseCurrentTabsOptions): CurrentTabsModel {
  const [captureState, setCaptureState] = useState<CaptureState>({ status: 'idle' });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTabIds, setSelectedTabIds] = useState<ReadonlySet<string>>(() => new Set());
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const snapshot = captureState.status === 'ready' ? captureState.snapshot : null;
  const filteredWindows = useMemo(
    () => filterWindows(snapshot?.windows ?? [], deferredSearchQuery),
    [deferredSearchQuery, snapshot],
  );
  const visibleTabIds = getTabIds(filteredWindows);
  const allVisibleSelected =
    visibleTabIds.length > 0 && visibleTabIds.every((tabId) => selectedTabIds.has(tabId));

  const loadTabs = async (): Promise<void> => {
    setCaptureState({ status: 'loading' });
    setFeedback(null);

    try {
      const nextSnapshot = await window.desktop.captureTabs();
      setCaptureState({ snapshot: nextSnapshot, status: 'ready' });
      setSelectedTabIds(new Set(getTabIds(nextSnapshot.windows)));
    } catch (error: unknown) {
      setCaptureState({ message: getErrorMessage(error), status: 'error' });
    }
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

  const toggleVisibleTabs = (): void => {
    setSelectedTabIds((current) => {
      const next = new Set(current);

      for (const tabId of visibleTabIds) {
        if (allVisibleSelected) {
          next.delete(tabId);
        } else {
          next.add(tabId);
        }
      }

      return next;
    });
  };

  const archiveSelectedTabs = async (closeAfterSave: boolean): Promise<void> => {
    if (snapshot === null || selectedTabIds.size === 0 || isSaving) {
      return;
    }

    if (
      closeAfterSave &&
      !window.confirm('Archive the selected tabs, then close them in Chrome?')
    ) {
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const result = await window.desktop.archiveTabs({
        closeAfterSave,
        name,
        selectedTabIds: getTabIds(snapshot.windows).filter((tabId) => selectedTabIds.has(tabId)),
      });

      onArchiveCreated(result.archive);
      setName('');
      setSelectedTabIds(new Set());
      setFeedback(createArchiveFeedback(result));
      await refreshAfterClose(result, setCaptureState);
    } catch (error: unknown) {
      setFeedback({ message: getErrorMessage(error), tone: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    allVisibleSelected,
    archiveSelectedTabs,
    captureState,
    feedback,
    filteredWindows,
    isSaving,
    loadTabs,
    name,
    searchQuery,
    selectedTabIds,
    setName,
    setSearchQuery,
    snapshot,
    toggleTab,
    toggleVisibleTabs,
  };
}
