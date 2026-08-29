import * as stylex from '@stylexjs/stylex';

import type { BrowserSnapshot, TabArchiveSummary } from '../../../shared/archive';
import { tokens } from '../../theme/tokens.stylex';
import { CurrentTabWindow } from './CurrentTabWindow';
import type { CaptureState, CurrentTabsModel, Feedback } from './use-current-tabs';
import { getTabIds, useCurrentTabs } from './use-current-tabs';

interface CurrentTabsPanelProps {
  readonly isActive: boolean;
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
  const totalTabCount = getTabIds(snapshot.windows).length;
  const visibleTabIds = getTabIds(model.filteredWindows);
  const selectedVisibleTabCount = visibleTabIds.filter((tabId) =>
    model.selectedTabIds.has(tabId),
  ).length;
  const hasPartiallySelectedVisibleTabs = selectedVisibleTabCount > 0 && !model.allVisibleSelected;

  return (
    <div {...stylex.props(styles.toolbar)}>
      <input
        {...stylex.props(styles.searchInput)}
        aria-label="Search Tabs"
        onChange={(event) => model.setSearchQuery(event.target.value)}
        placeholder="Search"
        type="search"
        value={model.searchQuery}
      />
      <div {...stylex.props(styles.toolbarActions)}>
        <div {...stylex.props(styles.selectionStatus)}>
          <label {...stylex.props(styles.selectionControl)}>
            <input
              {...stylex.props(styles.masterCheckbox)}
              aria-label="Select all visible tabs"
              checked={model.allVisibleSelected}
              disabled={visibleTabIds.length === 0}
              onChange={model.toggleVisibleTabs}
              ref={(input) => {
                if (input !== null) {
                  input.indeterminate = hasPartiallySelectedVisibleTabs;
                }
              }}
              title="Select all visible tabs"
              type="checkbox"
            />
            <span {...stylex.props(styles.count)}>
              {model.selectedTabIds.size} of {totalTabCount} selected
            </span>
          </label>
          {snapshot.excludedIncognitoWindowCount > 0 ? (
            <span {...stylex.props(styles.privateNotice)}>
              {snapshot.excludedIncognitoWindowCount} incognito{' '}
              {snapshot.excludedIncognitoWindowCount === 1 ? 'window' : 'windows'} excluded
            </span>
          ) : null}
        </div>
        <button
          {...stylex.props(styles.refreshButton)}
          aria-label="Refresh Tabs"
          onClick={model.loadTabs}
          type="button"
        >
          Refresh
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
          <p {...stylex.props(styles.stateText)}>No Results</p>
        )}
      </div>

      {model.feedback === null ? null : <FeedbackMessage feedback={model.feedback} />}

      <div {...stylex.props(styles.archiveBar)}>
        <input
          {...stylex.props(styles.nameInput)}
          aria-label="Archive Name"
          maxLength={80}
          onChange={(event) => model.setName(event.target.value)}
          placeholder="Archive Name"
          value={model.name}
        />
        <div {...stylex.props(styles.actions)}>
          <button
            {...stylex.props(styles.secondaryButton)}
            disabled={model.selectedTabIds.size === 0 || model.isSaving}
            onClick={() => model.archiveSelectedTabs(false)}
            type="button"
          >
            Archive
          </button>
          <button
            {...stylex.props(styles.primaryButton)}
            disabled={model.selectedTabIds.size === 0 || model.isSaving}
            onClick={() => model.archiveSelectedTabs(true)}
            type="button"
          >
            {model.isSaving ? 'Saving…' : 'Archive & Close'}
          </button>
        </div>
      </div>
    </>
  );
}

function SkeletonTabRow({ short = false }: { readonly short?: boolean }): React.JSX.Element {
  return (
    <div {...stylex.props(styles.skeletonTabRow)}>
      <span {...stylex.props(styles.skeletonBlock, styles.skeletonCheckbox)} />
      <span {...stylex.props(styles.skeletonTabCopy)}>
        <span
          {...stylex.props(
            styles.skeletonBlock,
            styles.skeletonTitle,
            short && styles.skeletonTitleShort,
          )}
        />
        <span {...stylex.props(styles.skeletonBlock, styles.skeletonDomain)} />
      </span>
    </div>
  );
}

function LoadingTabsView({
  onRetry,
}: {
  readonly onRetry: () => Promise<void>;
}): React.JSX.Element {
  return (
    <div {...stylex.props(styles.loadingView)} aria-busy="true">
      <span {...stylex.props(styles.visuallyHidden)} aria-label="Loading tabs" role="status" />
      <div {...stylex.props(styles.skeletonToolbar)}>
        <span {...stylex.props(styles.skeletonBlock, styles.skeletonSearch)} aria-hidden="true" />
        <div {...stylex.props(styles.skeletonToolbarActions)}>
          <span {...stylex.props(styles.skeletonBlock, styles.skeletonCount)} aria-hidden="true" />
          <button {...stylex.props(styles.refreshButton)} onClick={onRetry} type="button">
            Retry
          </button>
        </div>
      </div>
      <div {...stylex.props(styles.skeletonList)} aria-hidden="true">
        <div {...stylex.props(styles.skeletonWindowHeader)}>
          <span {...stylex.props(styles.skeletonBlock, styles.skeletonWindowTitle)} />
          <span {...stylex.props(styles.skeletonBlock, styles.skeletonWindowCount)} />
        </div>
        <SkeletonTabRow />
        <SkeletonTabRow short />
        <SkeletonTabRow />
        <div {...stylex.props(styles.skeletonWindowHeader)}>
          <span {...stylex.props(styles.skeletonBlock, styles.skeletonWindowTitle)} />
          <span {...stylex.props(styles.skeletonBlock, styles.skeletonWindowCount)} />
        </div>
        <SkeletonTabRow short />
        <SkeletonTabRow />
      </div>
      <div {...stylex.props(styles.archiveBar)} aria-hidden="true">
        <span {...stylex.props(styles.skeletonBlock, styles.skeletonArchiveInput)} />
        <span {...stylex.props(styles.actions)}>
          <span {...stylex.props(styles.skeletonBlock, styles.skeletonButton)} />
          <span {...stylex.props(styles.skeletonBlock, styles.skeletonButtonWide)} />
        </span>
      </div>
    </div>
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
            Load Tabs
          </button>
        </div>
      );
    case 'loading':
      return <LoadingTabsView onRetry={model.loadTabs} />;
    case 'error':
      return (
        <div {...stylex.props(styles.emptyState)}>
          <p {...stylex.props(styles.errorText)} role="alert">
            {state.message}
          </p>
          <button {...stylex.props(styles.secondaryButton)} onClick={model.loadTabs} type="button">
            Try Again
          </button>
        </div>
      );
    case 'ready':
      return <ReadyTabsView model={model} snapshot={state.snapshot} />;
  }
}

export function CurrentTabsPanel({
  isActive,
  onArchiveCreated,
}: CurrentTabsPanelProps): React.JSX.Element {
  const model = useCurrentTabs({ isActive, onArchiveCreated });

  return (
    <section {...stylex.props(styles.panel)} aria-label="Tabs">
      <CaptureBody model={model} state={model.captureState} />
    </section>
  );
}

const skeletonPulse = stylex.keyframes({
  '0%, 100%': { opacity: 0.42 },
  '50%': { opacity: 0.78 },
});

const styles = stylex.create({
  actions: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    gap: 8,
    width: {
      default: 'auto',
      '@media (max-width: 460px)': '100%',
    },
  },
  archiveBar: {
    alignItems: 'center',
    backgroundColor: tokens.surface,
    borderBlockStartColor: tokens.line,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: 1,
    display: 'grid',
    flexShrink: 0,
    gridTemplateColumns: {
      default: 'minmax(0, 1fr) auto',
      '@media (max-width: 460px)': 'minmax(0, 1fr)',
    },
    gap: 12,
    minHeight: {
      default: 72,
      '@media (max-width: 460px)': 120,
    },
    paddingBlock: {
      default: 0,
      '@media (max-width: 460px)': 10,
    },
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
  masterCheckbox: {
    accentColor: tokens.accent,
    cursor: 'pointer',
    flexShrink: 0,
    height: 16,
    margin: 0,
    width: 16,
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
  privateNotice: {
    color: tokens.warning,
    fontSize: 10,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  refreshButton: {
    ':focus-visible': {
      outlineColor: tokens.textPrimary,
      outlineOffset: -2,
    },
    ':hover': {
      backgroundColor: tokens.surfaceRaised,
      color: tokens.textPrimary,
    },
    backgroundColor: 'transparent',
    borderRadius: 7,
    borderWidth: 0,
    color: tokens.textSecondary,
    cursor: 'pointer',
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 600,
    minHeight: 44,
    minWidth: 44,
    paddingBlock: 8,
    paddingInline: 10,
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
  skeletonBlock: {
    animationDuration: '1.4s',
    animationIterationCount: 'infinite',
    animationName: {
      default: skeletonPulse,
      '@media (prefers-reduced-motion: reduce)': 'none',
    },
    animationTimingFunction: 'ease-in-out',
    backgroundColor: tokens.textMuted,
    borderRadius: 6,
    display: 'block',
  },
  skeletonArchiveInput: {
    height: 44,
    minWidth: 0,
    width: '100%',
  },
  skeletonButton: {
    height: 44,
    width: 68,
  },
  skeletonButtonWide: {
    height: 44,
    width: 108,
  },
  skeletonCheckbox: {
    borderRadius: 4,
    flexShrink: 0,
    height: 16,
    width: 16,
  },
  skeletonCount: {
    height: 10,
    width: 88,
  },
  skeletonDomain: {
    height: 8,
    width: 96,
  },
  skeletonList: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  skeletonSearch: {
    height: 44,
    width: '100%',
  },
  skeletonTabCopy: {
    display: 'grid',
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  skeletonTabRow: {
    alignItems: 'center',
    borderBlockStartColor: tokens.line,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: 1,
    display: 'flex',
    gap: 12,
    minHeight: 60,
    paddingInline: 20,
  },
  skeletonTitle: {
    height: 11,
    maxWidth: 220,
    width: '74%',
  },
  skeletonTitleShort: {
    maxWidth: 156,
    width: '52%',
  },
  skeletonToolbar: {
    backgroundColor: tokens.surface,
    borderBlockEndColor: tokens.line,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 1,
    display: 'grid',
    flexShrink: 0,
    gap: 8,
    minHeight: 104,
    paddingBlock: 8,
    paddingInline: 20,
  },
  skeletonToolbarActions: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  skeletonWindowCount: {
    height: 9,
    width: 18,
  },
  skeletonWindowHeader: {
    alignItems: 'center',
    backgroundColor: tokens.surfaceRaised,
    borderBlockStartColor: tokens.line,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: 1,
    display: 'flex',
    justifyContent: 'space-between',
    minHeight: 36,
    paddingInline: 20,
  },
  skeletonWindowTitle: {
    height: 10,
    width: 68,
  },
  stateText: {
    color: tokens.textMuted,
    fontSize: 12,
    margin: 0,
  },
  selectionControl: {
    alignItems: 'center',
    cursor: 'pointer',
    display: 'flex',
    gap: 8,
    minHeight: 44,
    minWidth: 0,
  },
  selectionStatus: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
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
  loadingView: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
  },
  visuallyHidden: {
    borderWidth: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: 1,
  },
  windowList: {
    contentVisibility: 'auto',
    flex: 1,
    minHeight: 0,
    overscrollBehaviorY: 'contain',
    overflowY: 'auto',
  },
});
