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

function ReadyTabsView({ model, snapshot }: ReadyTabsViewProps): React.JSX.Element {
  return (
    <>
      <div {...stylex.props(styles.toolbar)}>
        <label {...stylex.props(styles.searchField)}>
          <span {...stylex.props(styles.visuallyHidden)}>탭 검색</span>
          <input
            {...stylex.props(styles.input)}
            onChange={(event) => model.setSearchQuery(event.target.value)}
            placeholder="제목이나 주소 검색"
            type="search"
            value={model.searchQuery}
          />
        </label>
        <button
          {...stylex.props(styles.textButton)}
          onClick={model.toggleVisibleTabs}
          type="button"
        >
          {model.allVisibleSelected ? '검색 결과 선택 해제' : '검색 결과 모두 선택'}
        </button>
      </div>

      <div {...stylex.props(styles.summary)}>
        <span>
          전체 {getTabIds(snapshot.windows).length}개 · 선택 {model.selectedTabIds.size}개
        </span>
        {snapshot.excludedIncognitoWindowCount > 0 ? (
          <span {...stylex.props(styles.privateNotice)}>
            시크릿 창 {snapshot.excludedIncognitoWindowCount}개는 목록에서 제외했습니다
          </span>
        ) : null}
      </div>

      <div {...stylex.props(styles.windowList)}>
        {model.filteredWindows.length > 0 ? (
          model.filteredWindows.map((browserWindow) => (
            <CurrentTabWindow
              duplicateUrlCounts={model.duplicateUrlCounts}
              key={browserWindow.id}
              onToggleTab={model.toggleTab}
              selectedTabIds={model.selectedTabIds}
              window={browserWindow}
              windowNumber={browserWindow.position + 1}
            />
          ))
        ) : (
          <p {...stylex.props(styles.noResults)}>검색 결과가 없습니다</p>
        )}
      </div>

      <div {...stylex.props(styles.archiveBar)}>
        <label {...stylex.props(styles.nameField)}>
          <span {...stylex.props(styles.fieldLabel)}>보관함 이름</span>
          <input
            {...stylex.props(styles.input)}
            maxLength={80}
            onChange={(event) => model.setName(event.target.value)}
            placeholder="비워 두면 날짜로 이름을 만듭니다"
            value={model.name}
          />
        </label>
        <div {...stylex.props(styles.actions)}>
          <button
            {...stylex.props(styles.secondaryButton)}
            disabled={model.selectedTabIds.size === 0 || model.isSaving}
            onClick={() => model.archiveSelectedTabs(false)}
            type="button"
          >
            보관만
          </button>
          <button
            {...stylex.props(styles.primaryButton)}
            disabled={model.selectedTabIds.size === 0 || model.isSaving}
            onClick={() => model.archiveSelectedTabs(true)}
            type="button"
          >
            {model.isSaving ? '처리 중' : '보관하고 닫기'}
          </button>
        </div>
      </div>

      {model.feedback === null ? null : <FeedbackMessage feedback={model.feedback} />}
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
          <span {...stylex.props(styles.emptyIcon)} aria-hidden="true">
            ↗
          </span>
          <strong {...stylex.props(styles.emptyTitle)}>Chrome 탭을 불러와 정리해 보세요</strong>
          <p {...stylex.props(styles.emptyCopy)}>
            버튼을 누를 때만 탭 목록을 읽습니다. 아무 탭도 자동으로 닫지 않습니다.
          </p>
        </div>
      );
    case 'loading':
      return (
        <div {...stylex.props(styles.loadingState)} aria-live="polite">
          Chrome에서 탭 목록을 읽고 있습니다
        </div>
      );
    case 'error':
      return (
        <div {...stylex.props(styles.errorState)} role="alert">
          <strong>탭을 불러오지 못했습니다</strong>
          <span>{state.message}</span>
        </div>
      );
    case 'ready':
      return <ReadyTabsView model={model} snapshot={state.snapshot} />;
  }
}

export function CurrentTabsPanel({ onArchiveCreated }: CurrentTabsPanelProps): React.JSX.Element {
  const model = useCurrentTabs({ onArchiveCreated });

  return (
    <section {...stylex.props(styles.panel)} aria-labelledby="current-tabs-title">
      <header {...stylex.props(styles.panelHeader)}>
        <div>
          <p {...stylex.props(styles.eyebrow)}>OPEN IN CHROME</p>
          <h2 {...stylex.props(styles.title)} id="current-tabs-title">
            현재 탭
          </h2>
        </div>
        <button
          {...stylex.props(styles.secondaryButton)}
          disabled={model.captureState.status === 'loading' || model.isSaving}
          onClick={model.loadTabs}
          type="button"
        >
          {model.captureState.status === 'loading' ? '불러오는 중' : 'Chrome 탭 불러오기'}
        </button>
      </header>

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
    alignItems: 'flex-end',
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.line,
    borderRadius: 16,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    gap: 14,
    justifyContent: 'space-between',
    marginBlockStart: 18,
    padding: 15,
  },
  emptyCopy: {
    color: tokens.textMuted,
    fontSize: 13,
    lineHeight: 1.65,
    margin: 0,
    maxWidth: 390,
    textAlign: 'center',
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: tokens.accentMuted,
    borderRadius: 14,
    color: tokens.accent,
    display: 'flex',
    fontSize: 22,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  emptyState: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 11,
    justifyContent: 'center',
    minHeight: 410,
    padding: 36,
  },
  emptyTitle: {
    color: tokens.textPrimary,
    fontSize: 15,
  },
  errorState: {
    backgroundColor: tokens.dangerMuted,
    borderColor: tokens.danger,
    borderRadius: 14,
    borderStyle: 'solid',
    borderWidth: 1,
    color: tokens.danger,
    display: 'grid',
    fontSize: 12,
    gap: 6,
    marginBlockStart: 24,
    padding: 16,
  },
  eyebrow: {
    color: tokens.accent,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.14em',
    margin: 0,
  },
  feedback: {
    borderRadius: 12,
    fontSize: 12,
    lineHeight: 1.5,
    marginBlockEnd: 0,
    marginBlockStart: 12,
    paddingBlock: 10,
    paddingInline: 12,
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
  fieldLabel: {
    color: tokens.textMuted,
    fontSize: 10,
    fontWeight: 650,
  },
  input: {
    ':focus': {
      borderColor: tokens.accent,
      outline: 'none',
    },
    backgroundColor: tokens.canvas,
    borderColor: tokens.lineStrong,
    borderRadius: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    color: tokens.textPrimary,
    fontSize: 12,
    minWidth: 0,
    paddingBlock: 10,
    paddingInline: 12,
    width: '100%',
  },
  loadingState: {
    alignItems: 'center',
    color: tokens.textSecondary,
    display: 'flex',
    fontSize: 13,
    justifyContent: 'center',
    minHeight: 410,
  },
  nameField: {
    display: 'grid',
    flex: 1,
    gap: 7,
    maxWidth: 390,
    minWidth: 180,
  },
  noResults: {
    color: tokens.textMuted,
    fontSize: 13,
    margin: 0,
    paddingBlock: 70,
    textAlign: 'center',
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
    borderRadius: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    color: tokens.canvas,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 650,
    paddingBlock: 10,
    paddingInline: 14,
  },
  privateNotice: {
    color: tokens.warning,
  },
  searchField: {
    flex: 1,
    maxWidth: 340,
  },
  secondaryButton: {
    ':disabled': {
      cursor: 'not-allowed',
      opacity: 0.45,
    },
    ':hover': {
      backgroundColor: tokens.surfaceRaised,
    },
    backgroundColor: 'transparent',
    borderColor: tokens.lineStrong,
    borderRadius: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    color: tokens.textSecondary,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 650,
    paddingBlock: 10,
    paddingInline: 14,
  },
  summary: {
    alignItems: 'center',
    color: tokens.textMuted,
    display: 'flex',
    fontSize: 11,
    justifyContent: 'space-between',
    marginBlockEnd: 10,
    marginBlockStart: 14,
  },
  textButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: tokens.accent,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 650,
    padding: 8,
  },
  title: {
    color: tokens.textPrimary,
    fontSize: 25,
    fontWeight: 650,
    letterSpacing: '-0.04em',
    marginBlockEnd: 0,
    marginBlockStart: 6,
  },
  toolbar: {
    alignItems: 'center',
    display: 'flex',
    gap: 12,
    justifyContent: 'space-between',
    marginBlockStart: 22,
  },
  visuallyHidden: {
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: 1,
  },
  windowList: {
    contentVisibility: 'auto',
    display: 'grid',
    gap: 10,
    maxHeight: 'min(49vh, 560px)',
    overflowY: 'auto',
    paddingInlineEnd: 4,
  },
});
