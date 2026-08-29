import * as stylex from '@stylexjs/stylex';
import { useCallback, useRef, useState } from 'react';

import type { TabArchiveSummary } from '../../shared/archive';
import { ArchiveLibrary } from '../features/archive-library/ArchiveLibrary';
import { CurrentTabsPanel } from '../features/current-tabs/CurrentTabsPanel';
import { tokens } from '../theme/tokens.stylex';

type View = 'archives' | 'tabs';

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
        case 'ArrowLeft':
        case 'Home':
          event.preventDefault();
          selectView('tabs');
          break;
        case 'ArrowRight':
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
      <header {...stylex.props(styles.header)}>
        <div
          {...stylex.props(styles.navigation)}
          aria-label="화면"
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
            현재 탭
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
            보관함
          </button>
        </div>
      </header>

      <section
        {...stylex.props(styles.content)}
        aria-labelledby="tabs-tab"
        hidden={view !== 'tabs'}
        id="tabs-panel"
        role="tabpanel"
      >
        <CurrentTabsPanel onArchiveCreated={handleArchiveCreated} />
      </section>
      <section
        {...stylex.props(styles.content)}
        aria-labelledby="archives-tab"
        hidden={view !== 'archives'}
        id="archives-panel"
        role="tabpanel"
      >
        {hasVisitedArchives ? <ArchiveLibrary refreshKey={archiveRefreshKey} /> : null}
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
  header: {
    alignItems: 'flex-end',
    borderBlockEndColor: tokens.line,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 1,
    display: 'flex',
    flexShrink: 0,
    height: 56,
    paddingInline: 20,
  },
  navigation: {
    alignItems: 'stretch',
    display: 'flex',
    gap: 24,
    height: '100%',
  },
  navigationButton: {
    ':focus-visible': {
      outlineOffset: -3,
    },
    backgroundColor: 'transparent',
    borderBlockEndColor: 'transparent',
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 2,
    borderInlineWidth: 0,
    borderBlockStartWidth: 0,
    color: tokens.textMuted,
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    minHeight: 44,
    minWidth: 44,
    padding: 0,
  },
  navigationButtonActive: {
    borderBlockEndColor: tokens.accent,
    color: tokens.textPrimary,
  },
  page: {
    backgroundColor: tokens.canvas,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    minHeight: 560,
    minWidth: 420,
    overflow: 'hidden',
  },
});
