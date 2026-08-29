import * as stylex from '@stylexjs/stylex';

import type { BrowserSnapshot, TabArchiveSummary } from '../../../shared/archive';
import { tokens } from '../../theme/tokens.stylex';
import { CurrentTabWindow } from './CurrentTabWindow';
import type { CaptureState, CurrentTabsModel, Feedback } from './use-current-tabs';
import { getTabIds, useCurrentTabs } from './use-current-tabs';

interface CurrentTabsPanelProps {
  readonly onArchiveCreated: (archive: TabArchiveSummary) => void;
}

interface ReadyTabsViewProps {
  readonly model: CurrentTabsModel;
  readonly snapshot: BrowserSnapshot;
}

function FeedbackMessage({ feedback }: { readonly feedback: Feedback }): React.JSX.Element {
  const toneStyle = (() => {
    switch (feedback.tone) {
      case 'error':
        return styles.feedbackError;
      case 'success':
        return styles.feedbackSuccess;
      case 'warning':
        return styles.feedbackWarning;
    }
  })();

  return (
    <p {...stylex.props(styles.feedback, toneStyle)} aria-live="polite">
      {feedback.message}
    </p>
  );
}

function ReadyToolbar({ model, snapshot }: ReadyTabsViewProps): React.JSX.Element {
  return (
    <div {...stylex.props(styles.toolbar)}>
      <input
        {...stylex.props(styles.searchInput)}
        aria-label="탭 검색"
        onChange={(event) => model.setSearchQuery(event.target.value)}
        placeholder="검색"
        type="search"
        value={model.searchQuery}
      />
      <div {...stylex.props(styles.toolbarActions)}>
        <span {...stylex.props(styles.count)}>
          {model.selectedTabIds.size} / {getTabIds(snapshot.windows).length}
        </span>
        {snapshot.excludedIncognitoWindowCount > 0 ? (
          <span {...stylex.props(styles.privateNotice)}>
            시크릿 창 {snapshot.excludedIncognitoWindowCount}개 제외
          </span>
        ) : null}
        <button
          {...stylex.props(styles.textButton)}
          onClick={model.toggleVisibleTabs}
          type="button"
        >
          {model.allVisibleSelected ? '선택 해제' : '전체 선택'}
        </button>
        <button
          {...stylex.props(styles.iconButton)}
          aria-label="탭 다시 불러오기"
          onClick={model.loadTabs}
          type="button"
        >
          ↻
        </button>
      </div>
    </div>
  );
}

function ReadyTabsView({ model, snapshot }: ReadyTabsViewProps): React.JSX.Element {
  return (
    <>
      <ReadyToolbar model={model} snapshot={snapshot} />

      <div {...stylex.props(styles.windowList)}>
        {model.filteredWindows.length > 0 ? (
          model.filteredWindows.map((browserWindow) => (
            <CurrentTabWindow
              key={browserWindow.id}
              onToggleTab={model.toggleTab}
              selectedTabIds={model.selectedTabIds}
              window={browserWindow}
              windowNumber={browserWindow.position + 1}
            />
          ))
        ) : (
          <p {...stylex.props(styles.stateText)}>검색 결과 없음</p>
        )}
      </div>

      {model.feedback === null ? null : <FeedbackMessage feedback={model.feedback} />}

      <div {...stylex.props(styles.archiveBar)}>
        <input
          {...stylex.props(styles.nameInput)}
          aria-label="보관함 이름"
          maxLength={80}
          onChange={(event) => model.setName(event.target.value)}
          placeholder="보관함 이름"
          value={model.name}
        />
        <div {...stylex.props(styles.actions)}>
          <button
            {...stylex.props(styles.secondaryButton)}
            disabled={model.selectedTabIds.size === 0 || model.isSaving}
            onClick={() => model.archiveSelectedTabs(false)}
            type="button"
          >
            보관
          </button>
          <button
            {...stylex.props(styles.primaryButton)}
            disabled={model.selectedTabIds.size === 0 || model.isSaving}
            onClick={() => model.archiveSelectedTabs(true)}
            type="button"
          >
            {model.isSaving ? '처리 중' : '보관 후 닫기'}
          </button>
        </div>
      </div>
    </>
  );
}

function CaptureBody({
  model,
  state,
}: {
  readonly model: CurrentTabsModel;
  readonly state: CaptureState;
}): React.JSX.Element {
  switch (state.status) {
    case 'idle':
      return (
        <div {...stylex.props(styles.emptyState)}>
          <button {...stylex.props(styles.primaryButton)} onClick={model.loadTabs} type="button">
            탭 불러오기
          </button>
        </div>
      );
    case 'loading':
      return (
        <div {...stylex.props(styles.emptyState)} aria-live="polite">
          <span {...stylex.props(styles.stateText)}>불러오는 중</span>
        </div>
      );
    case 'error':
      return (
        <div {...stylex.props(styles.emptyState)}>
          <p {...stylex.props(styles.errorText)} role="alert">
            {state.message}
          </p>
          <button {...stylex.props(styles.secondaryButton)} onClick={model.loadTabs} type="button">
            다시 불러오기
          </button>
        </div>
      );
    case 'ready':
      return <ReadyTabsView model={model} snapshot={state.snapshot} />;
  }
}

export function CurrentTabsPanel({ onArchiveCreated }: CurrentTabsPanelProps): React.JSX.Element {
  const model = useCurrentTabs({ onArchiveCreated });

  return (
    <section {...stylex.props(styles.panel)} aria-label="현재 탭">
      <CaptureBody model={model} state={model.captureState} />
    </section>
  );
}

const styles = stylex.create({
  actions: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    gap: 8,
  },
  archiveBar: {
    alignItems: 'center',
    backgroundColor: tokens.surface,
    borderBlockStartColor: tokens.line,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: 1,
    display: 'grid',
    flexShrink: 0,
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: 12,
    minHeight: 72,
    paddingInline: 20,
  },
  count: {
    color: tokens.textMuted,
    fontSize: 11,
    whiteSpace: 'nowrap',
  },
  emptyState: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 12,
    justifyContent: 'center',
  },
  errorText: {
    color: tokens.danger,
    fontSize: 12,
    margin: 0,
  },
  feedback: {
    borderBlockStartColor: tokens.line,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: 1,
    flexShrink: 0,
    fontSize: 11,
    margin: 0,
    paddingBlock: 9,
    paddingInline: 20,
  },
  feedbackError: {
    backgroundColor: tokens.dangerMuted,
    color: tokens.danger,
  },
  feedbackSuccess: {
    backgroundColor: tokens.positiveMuted,
    color: tokens.positive,
  },
  feedbackWarning: {
    backgroundColor: tokens.warningMuted,
    color: tokens.warning,
  },
  iconButton: {
    ':hover': {
      backgroundColor: tokens.surfaceRaised,
    },
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: tokens.line,
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    color: tokens.textSecondary,
    cursor: 'pointer',
    display: 'flex',
    fontSize: 16,
    height: 44,
    justifyContent: 'center',
    padding: 0,
    minHeight: 44,
    minWidth: 44,
    width: 44,
  },
  nameInput: {
    ':focus': {
      borderColor: tokens.accent,
    },
    backgroundColor: tokens.surface,
    borderColor: tokens.lineStrong,
    borderRadius: 7,
    borderStyle: 'solid',
    borderWidth: 1,
    color: tokens.textPrimary,
    fontSize: 12,
    maxWidth: 'none',
    minHeight: 44,
    minWidth: 0,
    paddingBlock: 9,
    paddingInline: 11,
    width: '100%',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
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
  privateNotice: {
    color: tokens.warning,
    fontSize: 10,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  searchInput: {
    ':focus': {
      borderColor: tokens.accent,
    },
    backgroundColor: tokens.surfaceRaised,
    borderColor: 'transparent',
    borderRadius: 7,
    borderStyle: 'solid',
    borderWidth: 1,
    color: tokens.textPrimary,
    fontSize: 12,
    minHeight: 44,
    minWidth: 0,
    paddingBlock: 8,
    paddingInline: 11,
    width: '100%',
  },
  secondaryButton: {
    ':disabled': {
      cursor: 'not-allowed',
      opacity: 0.4,
    },
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
  stateText: {
    color: tokens.textMuted,
    fontSize: 12,
    margin: 0,
  },
  textButton: {
    ':hover': {
      color: tokens.textPrimary,
    },
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: tokens.accent,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    minHeight: 44,
    minWidth: 44,
    paddingBlock: 5,
    paddingInline: 8,
    whiteSpace: 'nowrap',
  },
  toolbar: {
    alignItems: 'center',
    backgroundColor: tokens.surface,
    borderBlockEndColor: tokens.line,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 1,
    display: 'grid',
    flexShrink: 0,
    gap: 8,
    gridTemplateColumns: 'minmax(0, 1fr)',
    minHeight: 104,
    paddingBlock: 8,
    paddingInline: 20,
  },
  toolbarActions: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
    justifyContent: 'space-between',
    minWidth: 0,
    width: '100%',
  },
  windowList: {
    contentVisibility: 'auto',
    flex: 1,
    minHeight: 0,
    overscrollBehaviorY: 'contain',
    overflowY: 'auto',
  },
});
