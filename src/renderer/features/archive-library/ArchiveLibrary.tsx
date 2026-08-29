import * as stylex from '@stylexjs/stylex';

import type { TabArchive, TabArchiveSummary } from '../../../shared/archive';
import { tokens } from '../../theme/tokens.stylex';
import { ArchiveWindowGroup } from './ArchiveWindowGroup';
import type { ArchiveLibraryModel, ArchiveListState } from './use-archive-library';
import { useArchiveLibrary } from './use-archive-library';

interface ArchiveLibraryProps {
  readonly refreshKey: number;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatCount(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

function ArchiveSummaryButton({
  archive,
  onOpen,
}: {
  readonly archive: TabArchiveSummary;
  readonly onOpen: (archiveId: string) => void;
}): React.JSX.Element {
  return (
    <li {...stylex.props(styles.archiveRow)}>
      <button
        {...stylex.props(styles.archiveButton)}
        onClick={() => onOpen(archive.id)}
        type="button"
      >
        <span {...stylex.props(styles.archiveCopy)}>
          <span {...stylex.props(styles.archiveName)}>{archive.name}</span>
          <span {...stylex.props(styles.archiveMeta)}>
            {formatDate(archive.createdAt)} · {formatCount(archive.tabCount, 'tab')} ·{' '}
            {formatCount(archive.windowCount, 'window')}
          </span>
        </span>
        <span {...stylex.props(styles.chevron)} aria-hidden="true">
          ›
        </span>
      </button>
    </li>
  );
}

function ArchiveList({
  onOpen,
  state,
}: {
  readonly onOpen: (archiveId: string) => void;
  readonly state: ArchiveListState;
}): React.JSX.Element {
  switch (state.status) {
    case 'loading':
      return <p {...stylex.props(styles.stateText)}>Loading…</p>;
    case 'error':
      return (
        <p {...stylex.props(styles.errorText)} role="alert">
          {state.message}
        </p>
      );
    case 'ready':
      return state.archives.length === 0 ? (
        <p {...stylex.props(styles.stateText)}>Archive is empty</p>
      ) : (
        <ul {...stylex.props(styles.archiveList)}>
          {state.archives.map((archive) => (
            <ArchiveSummaryButton archive={archive} key={archive.id} onOpen={onOpen} />
          ))}
        </ul>
      );
  }
}

function ArchiveDetails({
  archive,
  model,
}: {
  readonly archive: TabArchive;
  readonly model: ArchiveLibraryModel;
}): React.JSX.Element {
  const totalTabCount = archive.windows.reduce((count, window) => count + window.tabs.length, 0);
  const allSelected = totalTabCount > 0 && model.selectedTabIds.size === totalTabCount;

  return (
    <section {...stylex.props(styles.details)} aria-label={archive.name}>
      <header {...stylex.props(styles.detailHeader)}>
        <div {...stylex.props(styles.detailHeading)}>
          <button
            {...stylex.props(styles.backButton)}
            aria-label="Back to Archive"
            onClick={model.closeArchive}
            type="button"
          >
            ‹
          </button>
          <div {...stylex.props(styles.detailCopy)}>
            <h2 {...stylex.props(styles.detailTitle)}>{archive.name}</h2>
            <span {...stylex.props(styles.archiveMeta)}>
              {formatDate(archive.createdAt)} · {formatCount(totalTabCount, 'tab')} ·{' '}
              {formatCount(archive.windows.length, 'window')}
            </span>
          </div>
        </div>
        <button {...stylex.props(styles.textButton)} onClick={model.toggleAllTabs} type="button">
          {allSelected ? 'Clear' : 'Select All'}
        </button>
      </header>

      <div {...stylex.props(styles.detailWindows)}>
        {archive.windows.map((browserWindow) => (
          <ArchiveWindowGroup
            key={browserWindow.id}
            onToggleTab={model.toggleTab}
            selectedTabIds={model.selectedTabIds}
            window={browserWindow}
            windowNumber={browserWindow.position + 1}
          />
        ))}
      </div>

      {model.feedback === null ? null : (
        <p {...stylex.props(styles.feedback)} aria-live="polite">
          {model.feedback}
        </p>
      )}

      <div {...stylex.props(styles.detailActions)}>
        <button
          {...stylex.props(styles.deleteButton)}
          disabled={model.isBusy}
          onClick={model.deleteCurrentArchive}
          type="button"
        >
          Delete Archive
        </button>
        <button
          {...stylex.props(styles.primaryButton)}
          disabled={model.selectedTabIds.size === 0 || model.isBusy}
          onClick={model.restoreSelectedTabs}
          type="button"
        >
          {model.isBusy ? 'Working…' : 'Restore Selected'}
        </button>
      </div>
    </section>
  );
}

function ArchiveLibraryBody({ model }: { readonly model: ArchiveLibraryModel }): React.JSX.Element {
  switch (model.detailState.status) {
    case 'closed':
      return <ArchiveList onOpen={model.openArchive} state={model.listState} />;
    case 'loading':
      return <p {...stylex.props(styles.stateText)}>Loading…</p>;
    case 'error':
      return (
        <div {...stylex.props(styles.stateGroup)}>
          <p {...stylex.props(styles.errorText)} role="alert">
            {model.detailState.message}
          </p>
          <button
            {...stylex.props(styles.secondaryButton)}
            onClick={model.closeArchive}
            type="button"
          >
            Back
          </button>
        </div>
      );
    case 'ready':
      return <ArchiveDetails archive={model.detailState.archive} model={model} />;
  }
}

export function ArchiveLibrary({ refreshKey }: ArchiveLibraryProps): React.JSX.Element {
  const model = useArchiveLibrary(refreshKey);

  return (
    <aside {...stylex.props(styles.panel)} aria-label="Archive">
      <ArchiveLibraryBody model={model} />
    </aside>
  );
}

const styles = stylex.create({
  archiveButton: {
    ':focus-visible': {
      outlineOffset: -3,
    },
    ':hover': {
      backgroundColor: tokens.surfaceRaised,
    },
    alignItems: 'center',
    backgroundColor: tokens.surface,
    borderWidth: 0,
    color: tokens.textPrimary,
    cursor: 'pointer',
    display: 'flex',
    gap: 16,
    justifyContent: 'space-between',
    minHeight: 68,
    paddingBlock: 10,
    paddingInline: 20,
    textAlign: 'start',
    width: '100%',
  },
  archiveCopy: {
    display: 'grid',
    gap: 5,
    minWidth: 0,
  },
  archiveList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  archiveMeta: {
    color: tokens.textMuted,
    fontSize: 11,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  archiveName: {
    fontSize: 13,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  archiveRow: {
    borderBlockEndColor: tokens.line,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 1,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: tokens.textPrimary,
    cursor: 'pointer',
    display: 'flex',
    fontSize: 27,
    height: 44,
    justifyContent: 'center',
    padding: 0,
    width: 44,
  },
  chevron: {
    color: tokens.textMuted,
    flexShrink: 0,
    fontSize: 23,
  },
  deleteButton: {
    ':disabled': {
      cursor: 'not-allowed',
      opacity: 0.4,
    },
    ':hover': {
      backgroundColor: tokens.dangerMuted,
    },
    backgroundColor: tokens.dangerMuted,
    borderRadius: 8,
    borderWidth: 0,
    color: tokens.danger,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    minHeight: 44,
    minWidth: 44,
    paddingBlock: 9,
    paddingInline: 13,
  },
  detailActions: {
    alignItems: 'center',
    backgroundColor: tokens.surface,
    borderBlockStartColor: tokens.line,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: 1,
    display: 'flex',
    flexShrink: 0,
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 72,
    paddingInline: 20,
  },
  detailCopy: {
    display: 'grid',
    gap: 4,
    minWidth: 0,
  },
  detailHeader: {
    alignItems: 'center',
    borderBlockEndColor: tokens.line,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 1,
    display: 'flex',
    flexShrink: 0,
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 68,
    paddingInline: 20,
  },
  detailHeading: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    gap: 12,
    minWidth: 0,
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },
  detailTitle: {
    color: tokens.textPrimary,
    fontSize: 14,
    fontWeight: 650,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  detailWindows: {
    contentVisibility: 'auto',
    flex: 1,
    minHeight: 0,
    overscrollBehaviorY: 'contain',
    overflowY: 'auto',
  },
  errorText: {
    color: tokens.danger,
    fontSize: 12,
    margin: 0,
  },
  feedback: {
    backgroundColor: tokens.positiveMuted,
    borderBlockStartColor: tokens.line,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: 1,
    color: tokens.positive,
    flexShrink: 0,
    fontSize: 11,
    margin: 0,
    paddingBlock: 9,
    paddingInline: 20,
  },
  panel: {
    height: '100%',
    minHeight: 0,
    overflowY: 'auto',
  },
  primaryButton: {
    ':disabled': {
      cursor: 'not-allowed',
      opacity: 0.4,
    },
    ':hover': {
      backgroundColor: tokens.accentStrong,
    },
    backgroundColor: tokens.accent,
    borderRadius: 8,
    borderWidth: 0,
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 1px 2px rgba(0, 0, 0, 0.3)',
    color: tokens.textPrimary,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    minHeight: 44,
    minWidth: 44,
    paddingBlock: 9,
    paddingInline: 13,
  },
  secondaryButton: {
    ':hover': {
      backgroundColor: tokens.surfaceRaised,
    },
    backgroundColor: tokens.surfaceRaised,
    borderRadius: 8,
    borderWidth: 0,
    color: tokens.textSecondary,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    minHeight: 44,
    minWidth: 44,
    paddingBlock: 9,
    paddingInline: 13,
  },
  stateGroup: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    justifyContent: 'center',
    minHeight: 300,
  },
  stateText: {
    color: tokens.textMuted,
    fontSize: 12,
    margin: 0,
    paddingBlock: 90,
    textAlign: 'center',
  },
  textButton: {
    ':hover': {
      color: tokens.textPrimary,
    },
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: tokens.accentText,
    cursor: 'pointer',
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 600,
    minHeight: 44,
    minWidth: 44,
    paddingBlock: 5,
    paddingInline: 8,
  },
});
