export interface BrowserTab {
  readonly active: boolean;
  readonly id: string;
  readonly position: number;
  readonly title: string;
  readonly url: string;
}

export interface BrowserWindow {
  readonly id: string;
  readonly position: number;
  readonly tabs: readonly BrowserTab[];
}

export interface BrowserSnapshot {
  readonly capturedAt: string;
  readonly excludedIncognitoWindowCount: number;
  readonly source: 'chrome';
  readonly windows: readonly BrowserWindow[];
}

export interface TabArchive {
  readonly createdAt: string;
  readonly id: string;
  readonly name: string;
  readonly source: 'chrome';
  readonly windows: readonly BrowserWindow[];
}

export interface TabArchiveSummary {
  readonly createdAt: string;
  readonly id: string;
  readonly name: string;
  readonly tabCount: number;
  readonly windowCount: number;
}

export interface ArchiveTabsCommand {
  readonly closeAfterSave: boolean;
  readonly name: string;
  readonly selectedTabIds: readonly string[];
}

export type ArchiveCloseResult =
  | { readonly status: 'not-requested' }
  | {
      readonly closedTabCount: number;
      readonly skippedTabCount: number;
      readonly status: 'completed';
    }
  | { readonly message: string; readonly status: 'failed' };

export interface ArchiveTabsResult {
  readonly archive: TabArchiveSummary;
  readonly close: ArchiveCloseResult;
}

export interface RestoreArchiveCommand {
  readonly archiveId: string;
  readonly selectedTabIds: readonly string[];
}

export interface RestoreArchiveResult {
  readonly restoredTabCount: number;
  readonly windowCount: number;
}
