import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

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
  readonly isActive: boolean;
  readonly onArchiveCreated: (archive: TabArchiveSummary) => void;
}

interface RefreshTabsOptions {
  readonly queueIfBusy: boolean;
  readonly selectAll: boolean;
  readonly showLoading: boolean;
}

const autoRefreshIntervalMs = 15_000;

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

function hasSameTabs(current: BrowserSnapshot | null, next: BrowserSnapshot): boolean {
  return (
    current !== null &&
    current.excludedIncognitoWindowCount === next.excludedIncognitoWindowCount &&
    JSON.stringify(current.windows) === JSON.stringify(next.windows)
  );
}

function reconcileSelectedTabIds(
  current: ReadonlySet<string>,
  nextTabIds: readonly string[],
  selectAll: boolean,
  tabsUnchanged: boolean,
): ReadonlySet<string> {
  if (selectAll) {
    return new Set(nextTabIds);
  }

  if (tabsUnchanged) {
    return current;
  }

  const availableTabIds = new Set(nextTabIds);
  return new Set([...current].filter((tabId) => availableTabIds.has(tabId)));
}

function isDocumentActive(): boolean {
  return document.visibilityState === 'visible' && document.hasFocus();
}

function canApplyCapture(
  isEnabled: boolean,
  currentGeneration: number,
  captureGeneration: number,
): boolean {
  return isEnabled && currentGeneration === captureGeneration;
}

function mergeRefreshOptions(
  current: RefreshTabsOptions | null,
  next: RefreshTabsOptions,
): RefreshTabsOptions {
  if (current === null) {
    return next;
  }

  return {
    queueIfBusy: true,
    selectAll: current.selectAll || next.selectAll,
    showLoading: current.showLoading || next.showLoading,
  };
}

export function useCurrentTabs({
  isActive,
  onArchiveCreated,
}: UseCurrentTabsOptions): CurrentTabsModel {
  const [captureState, setCaptureState] = useState<CaptureState>({ status: 'idle' });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTabIds, setSelectedTabIds] = useState<ReadonlySet<string>>(() => new Set());
  const captureGenerationRef = useRef(0);
  const isRefreshEnabledRef = useRef(false);
  const isRefreshInFlightRef = useRef(false);
  const pendingRefreshRef = useRef<RefreshTabsOptions | null>(null);
  const snapshotRef = useRef<BrowserSnapshot | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const snapshot = captureState.status === 'ready' ? captureState.snapshot : null;
  const filteredWindows = useMemo(
    () => filterWindows(snapshot?.windows ?? [], deferredSearchQuery),
    [deferredSearchQuery, snapshot],
  );
  const visibleTabIds = getTabIds(filteredWindows);
  const allVisibleSelected =
    visibleTabIds.length > 0 && visibleTabIds.every((tabId) => selectedTabIds.has(tabId));

  const applySnapshot = useCallback(
    (nextSnapshot: BrowserSnapshot, { selectAll, showLoading }: RefreshTabsOptions): void => {
      const previousSnapshot = snapshotRef.current;
      const nextTabIds = getTabIds(nextSnapshot.windows);
      const tabsUnchanged = hasSameTabs(previousSnapshot, nextSnapshot);
      const shouldSelectAll = selectAll || previousSnapshot === null;

      setSelectedTabIds((current) =>
        reconcileSelectedTabIds(current, nextTabIds, shouldSelectAll, tabsUnchanged),
      );
      snapshotRef.current = nextSnapshot;

      if (showLoading || !tabsUnchanged) {
        setCaptureState({ snapshot: nextSnapshot, status: 'ready' });
      }
    },
    [],
  );

  const performRefresh = useCallback(
    async (options: RefreshTabsOptions, captureGeneration: number): Promise<void> => {
      try {
        const nextSnapshot = await window.desktop.captureTabs();

        if (
          !canApplyCapture(
            isRefreshEnabledRef.current,
            captureGenerationRef.current,
            captureGeneration,
          )
        ) {
          return;
        }

        applySnapshot(nextSnapshot, options);
      } catch (error: unknown) {
        if (
          canApplyCapture(
            isRefreshEnabledRef.current,
            captureGenerationRef.current,
            captureGeneration,
          ) &&
          (options.showLoading || snapshotRef.current === null)
        ) {
          setCaptureState({ message: getErrorMessage(error), status: 'error' });
        }
      }
    },
    [applySnapshot],
  );

  const runRefreshQueue = useCallback(
    async (firstOptions: RefreshTabsOptions): Promise<void> => {
      isRefreshInFlightRef.current = true;
      let nextOptions: RefreshTabsOptions | null = firstOptions;

      try {
        while (nextOptions !== null) {
          pendingRefreshRef.current = null;
          await performRefresh(nextOptions, captureGenerationRef.current);
          nextOptions = pendingRefreshRef.current;
        }
      } finally {
        isRefreshInFlightRef.current = false;
      }
    },
    [performRefresh],
  );

  const refreshTabs = useCallback(
    async (options: RefreshTabsOptions): Promise<void> => {
      if (!isRefreshEnabledRef.current) {
        return;
      }

      if (options.showLoading) {
        setCaptureState({ status: 'loading' });
        setFeedback(null);
      }

      if (isRefreshInFlightRef.current) {
        if (options.queueIfBusy) {
          captureGenerationRef.current += 1;
          pendingRefreshRef.current = mergeRefreshOptions(pendingRefreshRef.current, options);
        }

        return;
      }

      await runRefreshQueue(options);
    },
    [runRefreshQueue],
  );

  const loadTabs = useCallback(
    async (): Promise<void> =>
      refreshTabs({ queueIfBusy: true, selectAll: true, showLoading: true }),
    [refreshTabs],
  );

  const setRefreshEnabled = useCallback((isEnabled: boolean): void => {
    if (isRefreshEnabledRef.current === isEnabled) {
      return;
    }

    isRefreshEnabledRef.current = isEnabled;
    captureGenerationRef.current += 1;

    if (!isEnabled) {
      pendingRefreshRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      setRefreshEnabled(false);
      return undefined;
    }

    const refreshOnActivation = (): void => {
      const isInitialRefresh = snapshotRef.current === null;
      void refreshTabs({
        queueIfBusy: true,
        selectAll: isInitialRefresh,
        showLoading: isInitialRefresh,
      });
    };
    const updateActivity = (): void => {
      const wasRefreshEnabled = isRefreshEnabledRef.current;
      const isActiveDocument = isDocumentActive();
      setRefreshEnabled(isActiveDocument);

      if (isActiveDocument && !wasRefreshEnabled) {
        refreshOnActivation();
      }
    };
    const handleBlur = (): void => {
      setRefreshEnabled(false);
    };
    const intervalId = window.setInterval(() => {
      void refreshTabs({ queueIfBusy: false, selectAll: false, showLoading: false });
    }, autoRefreshIntervalMs);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', updateActivity);
    document.addEventListener('visibilitychange', updateActivity);
    setRefreshEnabled(isDocumentActive());

    if (isRefreshEnabledRef.current) {
      refreshOnActivation();
    }

    return () => {
      setRefreshEnabled(false);
      window.clearInterval(intervalId);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', updateActivity);
      document.removeEventListener('visibilitychange', updateActivity);
    };
  }, [isActive, refreshTabs, setRefreshEnabled]);

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

      if (result.close.status === 'completed') {
        await refreshTabs({ queueIfBusy: true, selectAll: false, showLoading: false });
      }
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
