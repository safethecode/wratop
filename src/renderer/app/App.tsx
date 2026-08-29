import * as stylex from '@stylexjs/stylex';
import { useCallback, useRef, useState } from 'react';

import type { TabArchiveSummary } from '../../shared/archive';
import { ArchiveLibrary } from '../features/archive-library/ArchiveLibrary';
import { CurrentTabsPanel } from '../features/current-tabs/CurrentTabsPanel';
import { tokens } from '../theme/tokens.stylex';

type View = 'archives' | 'tabs';

function CurrentTabsIcon(): React.JSX.Element {
  return (
    <svg
      {...stylex.props(styles.navigationIcon)}
      aria-hidden="true"
      fill="none"
      viewBox="0 0 20 20"
    >
      <rect height="11" rx="2" stroke="currentColor" strokeWidth="1.5" width="13" x="2.5" y="2.5" />
      <path
        d="M6 16.5h9.5a2 2 0 0 0 2-2V7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ArchivesIcon(): React.JSX.Element {
  return (
    <svg
      {...stylex.props(styles.navigationIcon)}
      aria-hidden="true"
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M3 6.5h14v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2.5 3.75h15v3h-15zM7.5 10h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function App(): React.JSX.Element {
  const [archiveRefreshKey, setArchiveRefreshKey] = useState(0);
  const [hasVisitedArchives, setHasVisitedArchives] = useState(false);
  const [view, setView] = useState<View>('tabs');
  const archivesTabRef = useRef<HTMLButtonElement>(null);
  const currentTabsTabRef = useRef<HTMLButtonElement>(null);
  const handleArchiveCreated = useCallback((archive: TabArchiveSummary): void => {
    void archive;
    setArchiveRefreshKey((current) => current + 1);
  }, []);
  const changeView = useCallback((nextView: View): void => {
    if (nextView === 'archives') {
      setHasVisitedArchives(true);
    }
    setView(nextView);
  }, []);
  const selectView = useCallback(
    (nextView: View): void => {
      changeView(nextView);
      const target = nextView === 'tabs' ? currentTabsTabRef.current : archivesTabRef.current;
      target?.focus();
    },
    [changeView],
  );
  const handleNavigationKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
      switch (event.key) {
        case 'ArrowUp':
        case 'Home':
          event.preventDefault();
          selectView('tabs');
          break;
        case 'ArrowDown':
        case 'End':
          event.preventDefault();
          selectView('archives');
          break;
      }
    },
    [selectView],
  );

  return (
    <main {...stylex.props(styles.page)}>
      <div className="titlebar-drag-region" aria-hidden="true" />
      <aside {...stylex.props(styles.sidebar)} aria-label="Navigation">
        <div
          {...stylex.props(styles.navigation)}
          aria-label="Views"
          aria-orientation="vertical"
          onKeyDown={handleNavigationKeyDown}
          role="tablist"
        >
          <button
            {...stylex.props(
              styles.navigationButton,
              view === 'tabs' && styles.navigationButtonActive,
            )}
            aria-controls="tabs-panel"
            aria-selected={view === 'tabs'}
            id="tabs-tab"
            onClick={() => changeView('tabs')}
            ref={currentTabsTabRef}
            role="tab"
            tabIndex={view === 'tabs' ? 0 : -1}
            type="button"
          >
            <CurrentTabsIcon />
            Tabs
          </button>
          <button
            {...stylex.props(
              styles.navigationButton,
              view === 'archives' && styles.navigationButtonActive,
            )}
            aria-controls="archives-panel"
            aria-selected={view === 'archives'}
            id="archives-tab"
            onClick={() => changeView('archives')}
            ref={archivesTabRef}
            role="tab"
            tabIndex={view === 'archives' ? 0 : -1}
            type="button"
          >
            <ArchivesIcon />
            Archive
          </button>
        </div>
      </aside>

      <section {...stylex.props(styles.workspace)}>
        <header {...stylex.props(styles.workspaceHeader)}>
          <h1 {...stylex.props(styles.workspaceTitle)}>{view === 'tabs' ? 'Tabs' : 'Archive'}</h1>
        </header>
        <div {...stylex.props(styles.content)}>
          <section
            {...stylex.props(styles.panel)}
            aria-labelledby="tabs-tab"
            hidden={view !== 'tabs'}
            id="tabs-panel"
            role="tabpanel"
          >
            <CurrentTabsPanel onArchiveCreated={handleArchiveCreated} />
          </section>
          <section
            {...stylex.props(styles.panel)}
            aria-labelledby="archives-tab"
            hidden={view !== 'archives'}
            id="archives-panel"
            role="tabpanel"
          >
            {hasVisitedArchives ? <ArchiveLibrary refreshKey={archiveRefreshKey} /> : null}
          </section>
        </div>
      </section>
    </main>
  );
}

const styles = stylex.create({
  content: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  navigation: {
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    width: '100%',
  },
  navigationButton: {
    ':focus-visible': {
      outlineColor: tokens.textPrimary,
      outlineOffset: -3,
    },
    ':hover': {
      backgroundColor: tokens.surfaceRaised,
      color: tokens.textPrimary,
    },
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 0,
    color: tokens.textMuted,
    cursor: 'pointer',
    display: 'flex',
    fontSize: 14,
    fontWeight: 600,
    gap: 10,
    minHeight: 44,
    paddingBlock: 0,
    paddingInline: 12,
    textAlign: 'start',
    width: '100%',
  },
  navigationButtonActive: {
    ':hover': {
      backgroundColor: tokens.accentStrong,
    },
    backgroundColor: tokens.accent,
    color: tokens.textPrimary,
  },
  navigationIcon: {
    flexShrink: 0,
    height: 20,
    width: 20,
  },
  page: {
    backgroundColor: tokens.canvas,
    display: 'grid',
    gridTemplateColumns: {
      default: '144px minmax(0, 1fr)',
      '@media (max-width: 460px)': '128px minmax(0, 1fr)',
    },
    height: '100vh',
    minHeight: 560,
    minWidth: 420,
    overflow: 'hidden',
  },
  panel: {
    height: '100%',
    minHeight: 0,
  },
  sidebar: {
    backgroundColor: tokens.canvas,
    borderInlineEndColor: tokens.line,
    borderInlineEndStyle: 'solid',
    borderInlineEndWidth: 1,
    minWidth: 0,
    paddingBlockEnd: 12,
    paddingBlockStart: 52,
    paddingInline: 10,
  },
  workspace: {
    backgroundColor: tokens.surface,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    minWidth: 0,
  },
  workspaceHeader: {
    alignItems: 'center',
    borderBlockEndColor: tokens.line,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 1,
    display: 'flex',
    flexShrink: 0,
    height: 56,
    paddingInline: 20,
  },
  workspaceTitle: {
    color: tokens.textPrimary,
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: -0.2,
    margin: 0,
  },
});
