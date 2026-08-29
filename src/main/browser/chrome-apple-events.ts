import type { BrowserSnapshot, BrowserWindow } from '../../shared/archive';
import { isBrowserWindow } from './browser-data';
import type { BrowserCloseResult, BrowserGateway, BrowserTabTarget } from './browser-gateway';
import {
  captureChromeTabsScript,
  closeChromeTabsScript,
  restoreChromeWindowsScript,
} from './chrome-jxa-scripts';

export type JxaExecutor = (script: string, arguments_: readonly string[]) => Promise<string>;

interface UnknownJxaResult extends Record<string, unknown> {
  readonly closedTabCount?: unknown;
  readonly excludedIncognitoWindowCount?: unknown;
  readonly skippedTabCount?: unknown;
  readonly status?: unknown;
  readonly windows?: unknown;
}

export class ChromeAppleEventsGateway implements BrowserGateway {
  public constructor(
    private readonly executeJxa: JxaExecutor,
    private readonly now: () => Date = () => new Date(),
  ) {}

  public async captureTabs(): Promise<BrowserSnapshot> {
    const serialized = await this.executeJxa(captureChromeTabsScript, []);
    const result: unknown = JSON.parse(serialized);

    if (this.isRecord(result) && result.status === 'not-running') {
      throw new Error('Chrome is not running');
    }

    if (
      !this.isRecord(result) ||
      result.status !== 'ok' ||
      typeof result.excludedIncognitoWindowCount !== 'number' ||
      !Number.isInteger(result.excludedIncognitoWindowCount) ||
      !Array.isArray(result.windows) ||
      !result.windows.every(isBrowserWindow)
    ) {
      throw new Error('Chrome returned an invalid tab response');
    }

    return {
      capturedAt: this.now().toISOString(),
      excludedIncognitoWindowCount: result.excludedIncognitoWindowCount,
      source: 'chrome',
      windows: result.windows,
    };
  }

  public async closeTabs(targets: readonly BrowserTabTarget[]): Promise<BrowserCloseResult> {
    const serialized = await this.executeJxa(closeChromeTabsScript, [JSON.stringify(targets)]);
    const result: unknown = JSON.parse(serialized);

    if (
      !this.isRecord(result) ||
      typeof result.closedTabCount !== 'number' ||
      !Number.isInteger(result.closedTabCount) ||
      result.closedTabCount < 0 ||
      typeof result.skippedTabCount !== 'number' ||
      !Number.isInteger(result.skippedTabCount) ||
      result.skippedTabCount < 0
    ) {
      throw new Error('Chrome returned an invalid close response');
    }

    return {
      closedTabCount: result.closedTabCount,
      skippedTabCount: result.skippedTabCount,
    };
  }

  public async restoreWindows(windows: readonly BrowserWindow[]): Promise<void> {
    const payload = windows.map((window) => {
      const tabs = [...window.tabs].sort((left, right) => left.position - right.position);
      const activePosition = tabs.findIndex((tab) => tab.active);

      return {
        activePosition: Math.max(0, activePosition),
        urls: tabs.map((tab) => tab.url),
      };
    });

    await this.executeJxa(restoreChromeWindowsScript, [JSON.stringify(payload)]);
  }

  private isRecord(value: unknown): value is UnknownJxaResult {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
