import type { BrowserTab, BrowserWindow } from '../../shared/archive';

interface UnknownBrowserData extends Record<string, unknown> {
  readonly active?: unknown;
  readonly id?: unknown;
  readonly position?: unknown;
  readonly tabs?: unknown;
  readonly title?: unknown;
  readonly url?: unknown;
}

function isRecord(value: unknown): value is UnknownBrowserData {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBrowserTab(value: unknown): value is BrowserTab {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.active === 'boolean' &&
    typeof value.id === 'string' &&
    Number.isInteger(value.position) &&
    typeof value.title === 'string' &&
    typeof value.url === 'string'
  );
}

export function isBrowserWindow(value: unknown): value is BrowserWindow {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    Number.isInteger(value.position) &&
    Array.isArray(value.tabs) &&
    value.tabs.every(isBrowserTab)
  );
}
