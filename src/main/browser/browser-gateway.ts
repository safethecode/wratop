import type { BrowserSnapshot, BrowserWindow } from '../../shared/archive';

export interface BrowserTabTarget {
  readonly expectedUrl: string;
  readonly tabId: string;
  readonly windowId: string;
}

export interface BrowserCloseResult {
  readonly closedTabCount: number;
  readonly skippedTabCount: number;
}

export interface BrowserGateway {
  captureTabs(): Promise<BrowserSnapshot>;
  closeTabs(targets: readonly BrowserTabTarget[]): Promise<BrowserCloseResult>;
  restoreWindows(windows: readonly BrowserWindow[]): Promise<void>;
}
