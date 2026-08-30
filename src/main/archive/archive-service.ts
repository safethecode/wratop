import { randomUUID } from 'node:crypto';

import type {
  ArchiveTabsCommand,
  ArchiveTabsResult,
  BrowserSnapshot,
  BrowserWindow,
  RestoreArchiveCommand,
  RestoreArchiveResult,
  TabArchive,
  TabArchiveSummary,
} from '../../shared/archive';
import type { BrowserGateway, BrowserTabTarget } from '../browser/browser-gateway';
import type { ArchiveRepository } from './archive-repository';

interface ArchiveServiceOptions {
  readonly createId?: () => string;
  readonly now?: () => Date;
  readonly orderSnapshot?: (snapshot: BrowserSnapshot) => Promise<BrowserSnapshot>;
}

const defaultOptions: Required<Pick<ArchiveServiceOptions, 'createId' | 'now'>> = {
  createId: randomUUID,
  now: () => new Date(),
};

export class ArchiveService {
  private captureInFlight: Promise<BrowserSnapshot> | null = null;

  public constructor(
    private readonly repository: ArchiveRepository,
    private readonly browserGateway: BrowserGateway,
    private readonly options: ArchiveServiceOptions = defaultOptions,
  ) {}

  public captureTabs(): Promise<BrowserSnapshot> {
    if (this.captureInFlight !== null) {
      return this.captureInFlight;
    }

    const capture = this.captureAndOrderTabs();
    this.captureInFlight = capture;

    const clearCapture = (): void => {
      if (this.captureInFlight === capture) {
        this.captureInFlight = null;
      }
    };
    void capture.then(clearCapture, clearCapture);

    return capture;
  }

  public deleteArchive(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  public getArchive(id: string): Promise<TabArchive | null> {
    return this.repository.get(id);
  }

  public listArchives(): Promise<readonly TabArchiveSummary[]> {
    return this.repository.list();
  }

  public async archiveTabs(command: ArchiveTabsCommand): Promise<ArchiveTabsResult> {
    const selectedIds = new Set(command.selectedTabIds);

    if (selectedIds.size === 0) {
      throw new Error('Select at least one tab');
    }

    const snapshot = await this.captureTabs();
    const windows = this.selectWindows(snapshot.windows, selectedIds);

    if (windows.length === 0) {
      throw new Error('Selected tabs are no longer available');
    }

    const createdAt = (this.options.now ?? defaultOptions.now)().toISOString();
    const archive: TabArchive = {
      createdAt,
      id: (this.options.createId ?? defaultOptions.createId)(),
      name: command.name.trim() || `${createdAt.slice(0, 10)} Chrome Tabs`,
      source: 'chrome',
      windows,
    };

    await this.repository.save(archive);

    const summary = this.summarize(archive);

    if (!command.closeAfterSave) {
      return { archive: summary, close: { status: 'not-requested' } };
    }

    const targets = this.createCloseTargets(windows);

    try {
      const closeResult = await this.browserGateway.closeTabs(targets);
      return { archive: summary, close: { ...closeResult, status: 'completed' } };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { archive: summary, close: { message, status: 'failed' } };
    }
  }

  public async restoreArchive(command: RestoreArchiveCommand): Promise<RestoreArchiveResult> {
    const selectedIds = new Set(command.selectedTabIds);

    if (selectedIds.size === 0) {
      throw new Error('Select at least one tab');
    }

    const archive = await this.repository.get(command.archiveId);

    if (archive === null) {
      throw new Error('Archive not found');
    }

    const windows = this.selectWindows(archive.windows, selectedIds);

    if (windows.length === 0) {
      throw new Error('Selected tabs are not in this archive');
    }

    await this.browserGateway.restoreWindows(windows);

    return {
      restoredTabCount: windows.reduce((count, window) => count + window.tabs.length, 0),
      windowCount: windows.length,
    };
  }

  private createCloseTargets(windows: readonly BrowserWindow[]): readonly BrowserTabTarget[] {
    return windows.flatMap((window) =>
      window.tabs.map((tab) => ({
        expectedUrl: tab.url,
        tabId: tab.id,
        windowId: window.id,
      })),
    );
  }

  private async captureAndOrderTabs(): Promise<BrowserSnapshot> {
    const snapshot = await this.browserGateway.captureTabs();
    return this.options.orderSnapshot?.(snapshot) ?? snapshot;
  }

  private selectWindows(
    windows: readonly BrowserWindow[],
    selectedIds: ReadonlySet<string>,
  ): readonly BrowserWindow[] {
    const selectedWindows: BrowserWindow[] = [];

    for (const window of windows) {
      const tabs = window.tabs.filter((tab) => selectedIds.has(tab.id));

      if (tabs.length > 0) {
        selectedWindows.push({ ...window, tabs });
      }
    }

    return selectedWindows;
  }

  private summarize(archive: TabArchive): TabArchiveSummary {
    return {
      createdAt: archive.createdAt,
      id: archive.id,
      name: archive.name,
      tabCount: archive.windows.reduce((count, window) => count + window.tabs.length, 0),
      windowCount: archive.windows.length,
    };
  }
}
