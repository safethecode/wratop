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
