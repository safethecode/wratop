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

  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
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
            {formatDate(archive.createdAt)} · {archive.tabCount}개 · 창 {archive.windowCount}개
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
      return <p {...stylex.props(styles.stateText)}>불러오는 중</p>;
    case 'error':
      return (
        <p {...stylex.props(styles.errorText)} role="alert">
          {state.message}
        </p>
      );
    case 'ready':
      return state.archives.length === 0 ? (
        <p {...stylex.props(styles.stateText)}>보관함이 비어 있습니다</p>
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
            aria-label="보관함 목록으로 돌아가기"
            onClick={model.closeArchive}
            type="button"
          >
            ‹
          </button>
          <div {...stylex.props(styles.detailCopy)}>
            <h2 {...stylex.props(styles.detailTitle)}>{archive.name}</h2>
            <span {...stylex.props(styles.archiveMeta)}>
              {formatDate(archive.createdAt)} · {totalTabCount}개 · 창 {archive.windows.length}개
            </span>
          </div>
        </div>
        <button {...stylex.props(styles.textButton)} onClick={model.toggleAllTabs} type="button">
          {allSelected ? '선택 해제' : '전체 선택'}
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
          보관함 삭제
        </button>
        <button
          {...stylex.props(styles.primaryButton)}
          disabled={model.selectedTabIds.size === 0 || model.isBusy}
          onClick={model.restoreSelectedTabs}
          type="button"
        >
          {model.isBusy ? '처리 중' : '선택한 탭 복원'}
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
      return <p {...stylex.props(styles.stateText)}>불러오는 중</p>;
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
            돌아가기
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
    <aside {...stylex.props(styles.panel)} aria-label="보관함">
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
    backgroundColor: tokens.surface,
    borderColor: tokens.lineStrong,
    borderRadius: 7,
    borderStyle: 'solid',
    borderWidth: 1,
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
    borderColor: tokens.accent,
    borderRadius: 7,
    borderStyle: 'solid',
    borderWidth: 1,
    color: tokens.canvas,
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
    backgroundColor: tokens.surface,
    borderColor: tokens.lineStrong,
    borderRadius: 7,
    borderStyle: 'solid',
    borderWidth: 1,
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
    color: tokens.accent,
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
