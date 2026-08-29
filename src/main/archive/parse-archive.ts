import type { BrowserTab, BrowserWindow, TabArchive } from '../../shared/archive';

interface UnknownRecord extends Record<string, unknown> {
  readonly active?: unknown;
  readonly createdAt?: unknown;
  readonly id?: unknown;
  readonly name?: unknown;
  readonly position?: unknown;
  readonly source?: unknown;
  readonly tabs?: unknown;
  readonly title?: unknown;
  readonly url?: unknown;
  readonly windows?: unknown;
}

function isRecord(value: unknown): value is UnknownRecord {
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

function isBrowserWindow(value: unknown): value is BrowserWindow {
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

function isTabArchive(value: unknown): value is TabArchive {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.createdAt === 'string' &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    value.source === 'chrome' &&
    Array.isArray(value.windows) &&
    value.windows.every(isBrowserWindow)
  );
}

export function parseTabArchive(serialized: string): TabArchive {
  let value: unknown;

  try {
    value = JSON.parse(serialized);
  } catch {
    throw new Error('Invalid archive data');
  }

  if (!isTabArchive(value)) {
    throw new Error('Invalid archive data');
  }

  return value;
}
