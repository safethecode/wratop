import type { ArchiveTabsCommand, RestoreArchiveCommand } from '../../shared/archive';

const archiveIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

interface UnknownArchiveCommand extends Readonly<Record<string, unknown>> {
  readonly archiveId?: unknown;
  readonly closeAfterSave?: unknown;
  readonly name?: unknown;
  readonly selectedTabIds?: unknown;
}

function isRecord(value: unknown): value is UnknownArchiveCommand {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTabIdList(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((tabId) => typeof tabId === 'string' && tabId.length > 0)
  );
}

export function parseArchiveId(value: unknown): string {
  if (typeof value !== 'string' || !archiveIdPattern.test(value)) {
    throw new Error('Invalid archive id');
  }

  return value;
}

export function parseArchiveTabsCommand(value: unknown): ArchiveTabsCommand {
  if (
    !isRecord(value) ||
    typeof value.closeAfterSave !== 'boolean' ||
    typeof value.name !== 'string' ||
    !isTabIdList(value.selectedTabIds)
  ) {
    throw new Error('Invalid archive tabs command');
  }

  return {
    closeAfterSave: value.closeAfterSave,
    name: value.name,
    selectedTabIds: value.selectedTabIds,
  };
}

export function parseRestoreArchiveCommand(value: unknown): RestoreArchiveCommand {
  if (!isRecord(value) || !isTabIdList(value.selectedTabIds)) {
    throw new Error('Invalid restore archive command');
  }

  try {
    return {
      archiveId: parseArchiveId(value.archiveId),
      selectedTabIds: value.selectedTabIds,
    };
  } catch {
    throw new Error('Invalid restore archive command');
  }
}
