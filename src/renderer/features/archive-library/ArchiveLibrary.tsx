import * as stylex from '@stylexjs/stylex';

import type { TabArchive, TabArchiveSummary } from '../../../shared/archive';
import { tokens } from '../../theme/tokens.stylex';
import { ArchiveWindowGroup } from './ArchiveWindowGroup';
import type {
  ArchiveDetailState,
  ArchiveLibraryModel,
  ArchiveListState,
} from './use-archive-library';
import { useArchiveLibrary } from './use-archive-library';

interface ArchiveLibraryProps {
  readonly refreshKey: number;
}

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function ArchiveSummaryButton({
  archive,
  onOpen,
}: {
  readonly archive: TabArchiveSummary;
  readonly onOpen: (archiveId: string) => void;
}): React.JSX.Element {
  return (
    <li>
      <button
        {...stylex.props(styles.archiveButton)}
        onClick={() => onOpen(archive.id)}
        type="button"
      >
        <span {...stylex.props(styles.archiveName)}>{archive.name}</span>
        <span {...stylex.props(styles.archiveMeta)}>
          {archive.tabCount}개 탭 · {archive.windowCount}개 창
        </span>
        <time {...stylex.props(styles.archiveDate)} dateTime={archive.createdAt}>
          {formatDate(archive.createdAt)}
        </time>
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
      return <p {...stylex.props(styles.stateText)}>보관함을 불러오는 중입니다</p>;
    case 'error':
      return (
        <p {...stylex.props(styles.errorText)} role="alert">
          {state.message}
        </p>
      );
    case 'ready':
      return state.archives.length === 0 ? (
        <p {...stylex.props(styles.stateText)}>아직 보관한 탭이 없습니다</p>
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
    <section {...stylex.props(styles.details)} aria-labelledby="archive-detail-title">
      <header {...stylex.props(styles.detailHeader)}>
        <div {...stylex.props(styles.detailTitleGroup)}>
          <button
            {...stylex.props(styles.closeButton)}
            aria-label="보관함 상세 닫기"
            onClick={model.closeArchive}
            type="button"
          >
            ←
          </button>
          <div {...stylex.props(styles.detailHeadingCopy)}>
            <h3 {...stylex.props(styles.detailTitle)} id="archive-detail-title">
              {archive.name}
            </h3>
            <span {...stylex.props(styles.archiveMeta)}>
              {totalTabCount}개 탭 · {archive.windows.length}개 창
            </span>
          </div>
        </div>
        <button {...stylex.props(styles.textButton)} onClick={model.toggleAllTabs} type="button">
          {allSelected ? '선택 해제' : '모두 선택'}
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

      {model.feedback === null ? null : (
        <p {...stylex.props(styles.feedback)} aria-live="polite">
          {model.feedback}
        </p>
      )}
    </section>
  );
}

function DetailBody({
  model,
  state,
}: {
  readonly model: ArchiveLibraryModel;
  readonly state: ArchiveDetailState;
}): React.JSX.Element {
  switch (state.status) {
    case 'closed':
      return (
        <div {...stylex.props(styles.detailEmpty)}>
          <span {...stylex.props(styles.detailEmptyMark)} aria-hidden="true">
            ◫
          </span>
          <p>보관함을 선택하면 탭을 확인하고 복원할 수 있습니다</p>
        </div>
      );
    case 'loading':
      return <p {...stylex.props(styles.stateText)}>탭을 불러오는 중입니다</p>;
    case 'error':
      return (
        <p {...stylex.props(styles.errorText)} role="alert">
          {state.message}
        </p>
      );
    case 'ready':
      return <ArchiveDetails archive={state.archive} model={model} />;
  }
}

export function ArchiveLibrary({ refreshKey }: ArchiveLibraryProps): React.JSX.Element {
  const model = useArchiveLibrary(refreshKey);

  return (
    <aside {...stylex.props(styles.panel)} aria-labelledby="archive-library-title">
      <header {...stylex.props(styles.panelHeader)}>
        <div>
          <p {...stylex.props(styles.eyebrow)}>SAVED LOCALLY</p>
          <h2 {...stylex.props(styles.title)} id="archive-library-title">
            보관함
          </h2>
        </div>
      </header>

      <ArchiveList onOpen={model.openArchive} state={model.listState} />
      <div {...stylex.props(styles.divider)} />
      <DetailBody model={model} state={model.detailState} />
    </aside>
  );
}

const styles = stylex.create({
  archiveButton: {
    ':hover': {
      backgroundColor: tokens.surfaceRaised,
      borderColor: tokens.lineStrong,
    },
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: 12,
    borderStyle: 'solid',
    borderWidth: 1,
    color: tokens.textPrimary,
    cursor: 'pointer',
    display: 'grid',
    gap: 5,
    padding: 12,
    textAlign: 'start',
    width: '100%',
  },
  archiveDate: {
    color: tokens.textMuted,
    fontSize: 9,
    marginBlockStart: 2,
  },
  archiveList: {
    display: 'grid',
    gap: 5,
    listStyle: 'none',
    marginBlockEnd: 0,
    marginBlockStart: 18,
    maxHeight: 240,
    overflowY: 'auto',
    padding: 0,
  },
  archiveMeta: {
    color: tokens.textMuted,
    fontSize: 10,
  },
  archiveName: {
    fontSize: 12,
    fontWeight: 650,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.line,
    borderRadius: 9,
    borderStyle: 'solid',
    borderWidth: 1,
    color: tokens.textSecondary,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    height: 30,
    justifyContent: 'center',
    padding: 0,
    width: 30,
  },
  deleteButton: {
    ':disabled': {
      cursor: 'not-allowed',
      opacity: 0.45,
    },
    backgroundColor: 'transparent',
    borderColor: tokens.danger,
    borderRadius: 9,
    borderStyle: 'solid',
    borderWidth: 1,
    color: tokens.danger,
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 650,
    paddingBlock: 9,
    paddingInline: 11,
  },
  detailActions: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
    justifyContent: 'space-between',
    marginBlockStart: 12,
  },
  detailEmpty: {
    alignItems: 'center',
    color: tokens.textMuted,
    display: 'flex',
    flexDirection: 'column',
    fontSize: 11,
    gap: 9,
    lineHeight: 1.6,
    minHeight: 190,
    padding: 28,
    textAlign: 'center',
  },
  detailEmptyMark: {
    color: tokens.lineStrong,
    fontSize: 32,
  },
  detailHeader: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
    justifyContent: 'space-between',
  },
  detailHeadingCopy: {
    display: 'grid',
    gap: 4,
    minWidth: 0,
  },
  details: {
    marginBlockStart: 16,
  },
  detailTitle: {
    color: tokens.textPrimary,
    fontSize: 13,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  detailTitleGroup: {
    alignItems: 'center',
    display: 'flex',
    gap: 10,
    minWidth: 0,
  },
  detailWindows: {
    contentVisibility: 'auto',
    display: 'grid',
    gap: 8,
    marginBlockStart: 13,
    maxHeight: 'min(35vh, 360px)',
    overflowY: 'auto',
    paddingInlineEnd: 3,
  },
  divider: {
    backgroundColor: tokens.line,
    height: 1,
    marginBlockStart: 18,
  },
  errorText: {
    color: tokens.danger,
    fontSize: 11,
    lineHeight: 1.55,
    marginBlockEnd: 0,
    marginBlockStart: 18,
  },
  eyebrow: {
    color: tokens.positive,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.14em',
    margin: 0,
  },
  feedback: {
    backgroundColor: tokens.positiveMuted,
    borderRadius: 10,
    color: tokens.positive,
    fontSize: 10,
    lineHeight: 1.5,
    marginBlockEnd: 0,
    marginBlockStart: 10,
    padding: 10,
  },
  panel: {
    backgroundColor: tokens.surfaceMuted,
    borderColor: tokens.line,
    borderRadius: 22,
    borderStyle: 'solid',
    borderWidth: 1,
    minWidth: 0,
    padding: 22,
  },
  panelHeader: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
  primaryButton: {
    ':disabled': {
      cursor: 'not-allowed',
      opacity: 0.45,
    },
    ':hover': {
      backgroundColor: tokens.accentStrong,
    },
    backgroundColor: tokens.accent,
    borderColor: tokens.accent,
    borderRadius: 9,
    borderStyle: 'solid',
    borderWidth: 1,
    color: tokens.canvas,
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 700,
    paddingBlock: 9,
    paddingInline: 12,
  },
  stateText: {
    color: tokens.textMuted,
    fontSize: 11,
    lineHeight: 1.55,
    marginBlockEnd: 0,
    marginBlockStart: 18,
    paddingBlock: 14,
    textAlign: 'center',
  },
  textButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: tokens.accent,
    cursor: 'pointer',
    flexShrink: 0,
    fontSize: 10,
    fontWeight: 650,
    padding: 7,
  },
  title: {
    color: tokens.textPrimary,
    fontSize: 25,
    fontWeight: 650,
    letterSpacing: '-0.04em',
    marginBlockEnd: 0,
    marginBlockStart: 6,
  },
});
