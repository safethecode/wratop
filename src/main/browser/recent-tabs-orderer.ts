import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { BrowserSnapshot, BrowserTab } from '../../shared/archive';

interface StoredRecentTabs {
  readonly firstSeenAtByTabId: Readonly<Record<string, number>>;
  readonly version: 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseFirstSeenAtByTabId(serialized: string): Map<string, number> {
  const value: unknown = JSON.parse(serialized);

  if (!isRecord(value)) {
    return new Map();
  }

  const { firstSeenAtByTabId, version } = value;

  if (version !== 1 || !isRecord(firstSeenAtByTabId)) {
    return new Map();
  }

  const entries = Object.entries(firstSeenAtByTabId).filter(
    (entry): entry is [string, number] =>
      typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] >= 0,
  );

  return new Map(entries);
}

export class RecentTabsOrderer {
  private firstSeenAtByTabId: Map<string, number> | null = null;
  private hasUnsavedChanges = false;

  public constructor(
    private readonly metadataPath: string,
    private readonly now: () => number = Date.now,
  ) {}

  public async order(snapshot: BrowserSnapshot): Promise<BrowserSnapshot> {
    const firstSeenAtByTabId = await this.loadFirstSeenAtByTabId();
    const currentTabIds = new Set<string>();
    const observedAt = this.now();
    let hasChanges = false;

    for (const window of snapshot.windows) {
      for (const tab of window.tabs) {
        currentTabIds.add(tab.id);

        if (!firstSeenAtByTabId.has(tab.id)) {
          firstSeenAtByTabId.set(tab.id, observedAt);
          hasChanges = true;
        }
      }
    }

    for (const tabId of firstSeenAtByTabId.keys()) {
      if (!currentTabIds.has(tabId)) {
        firstSeenAtByTabId.delete(tabId);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.hasUnsavedChanges = true;
    }

    if (this.hasUnsavedChanges) {
      this.hasUnsavedChanges = !(await this.saveFirstSeenAtByTabId(firstSeenAtByTabId));
    }

    return {
      ...snapshot,
      windows: snapshot.windows.map((window) => ({
        ...window,
        tabs: this.orderTabs(window.tabs, firstSeenAtByTabId),
      })),
    };
  }

  private async loadFirstSeenAtByTabId(): Promise<Map<string, number>> {
    if (this.firstSeenAtByTabId !== null) {
      return this.firstSeenAtByTabId;
    }

    try {
      const serialized = await readFile(this.metadataPath, 'utf8');
      this.firstSeenAtByTabId = parseFirstSeenAtByTabId(serialized);
    } catch {
      this.firstSeenAtByTabId = new Map();
    }

    return this.firstSeenAtByTabId;
  }

  private orderTabs(
    tabs: readonly BrowserTab[],
    firstSeenAtByTabId: ReadonlyMap<string, number>,
  ): readonly BrowserTab[] {
    return tabs
      .map((tab, originalIndex) => ({
        firstSeenAt: firstSeenAtByTabId.get(tab.id) ?? 0,
        originalIndex,
        tab,
      }))
      .sort(
        (left, right) =>
          right.firstSeenAt - left.firstSeenAt || left.originalIndex - right.originalIndex,
      )
      .map(({ tab }) => tab);
  }

  private async saveFirstSeenAtByTabId(
    firstSeenAtByTabId: ReadonlyMap<string, number>,
  ): Promise<boolean> {
    const storedRecentTabs: StoredRecentTabs = {
      firstSeenAtByTabId: Object.fromEntries(firstSeenAtByTabId),
      version: 1,
    };
    const temporaryPath = `${this.metadataPath}.${randomUUID()}.tmp`;

    try {
      await mkdir(path.dirname(this.metadataPath), { recursive: true });
      await writeFile(temporaryPath, `${JSON.stringify(storedRecentTabs, null, 2)}\n`, {
        encoding: 'utf8',
        flush: true,
      });
      await rename(temporaryPath, this.metadataPath);
      return true;
    } catch {
      return false;
    } finally {
      try {
        await rm(temporaryPath, { force: true });
      } catch {
        // The parent path can be temporarily unavailable. The next capture retries the save.
      }
    }
  }
}
