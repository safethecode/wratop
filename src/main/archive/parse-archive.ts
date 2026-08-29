import type { TabArchive } from '../../shared/archive';
import { isBrowserWindow } from '../browser/browser-data';

interface UnknownRecord extends Record<string, unknown> {
  readonly createdAt?: unknown;
  readonly id?: unknown;
  readonly name?: unknown;
  readonly source?: unknown;
  readonly windows?: unknown;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
