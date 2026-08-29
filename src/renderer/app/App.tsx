import * as stylex from '@stylexjs/stylex';
import { useCallback, useState } from 'react';

import type { TabArchiveSummary } from '../../shared/archive';
import { ArchiveLibrary } from '../features/archive-library/ArchiveLibrary';
import { CurrentTabsPanel } from '../features/current-tabs/CurrentTabsPanel';
import { tokens } from '../theme/tokens.stylex';

export function App(): React.JSX.Element {
  const [archiveRefreshKey, setArchiveRefreshKey] = useState(0);
  const handleArchiveCreated = useCallback((archive: TabArchiveSummary): void => {
    void archive;
    setArchiveRefreshKey((current) => current + 1);
  }, []);

  return (
    <main {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.brand)}>
          <span {...stylex.props(styles.brandMark)} aria-hidden="true">
            w
          </span>
          <span>wratop</span>
        </div>
        <span {...stylex.props(styles.localBadge)}>내 Mac에만 보관</span>
      </header>

      <section {...stylex.props(styles.intro)} aria-labelledby="page-title">
        <p {...stylex.props(styles.eyebrow)}>TAB ARCHIVE</p>
        <h1 {...stylex.props(styles.title)} id="page-title">
          열어 둔 것을 잃지 않고 정리하세요
        </h1>
        <p {...stylex.props(styles.copy)}>
          필요한 탭을 골라 창 단위로 보관하고, 나중에 같은 묶음으로 다시 열 수 있습니다.
        </p>
      </section>

      <div {...stylex.props(styles.workspace)}>
        <CurrentTabsPanel onArchiveCreated={handleArchiveCreated} />
        <ArchiveLibrary refreshKey={archiveRefreshKey} />
      </div>
    </main>
  );
}

const styles = stylex.create({
  brand: {
    alignItems: 'center',
    color: tokens.textPrimary,
    display: 'flex',
    fontSize: 15,
    fontWeight: 700,
    gap: 10,
    letterSpacing: '-0.02em',
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: tokens.accent,
    borderRadius: 9,
    color: tokens.canvas,
    display: 'flex',
    fontSize: 15,
    fontWeight: 800,
    height: 28,
    justifyContent: 'center',
    transform: 'rotate(-5deg)',
    width: 28,
  },
  copy: {
    color: tokens.textSecondary,
    fontSize: 14,
    lineHeight: 1.7,
    marginBlockEnd: 0,
    marginBlockStart: 13,
  },
  eyebrow: {
    color: tokens.accent,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.15em',
    margin: 0,
  },
  header: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
  intro: {
    marginBlockStart: 50,
  },
  localBadge: {
    backgroundColor: tokens.positiveMuted,
    borderRadius: 999,
    color: tokens.positive,
    fontSize: 10,
    fontWeight: 650,
    paddingBlock: 7,
    paddingInline: 11,
  },
  page: {
    marginInline: 'auto',
    maxWidth: 1180,
    minHeight: '100vh',
    paddingBlock: 30,
    paddingInline: 34,
  },
  title: {
    color: tokens.textPrimary,
    fontSize: 'clamp(34px, 5vw, 54px)',
    fontWeight: 680,
    letterSpacing: '-0.06em',
    lineHeight: 1.08,
    marginBlockEnd: 0,
    marginBlockStart: 10,
  },
  workspace: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: {
      default: 'minmax(0, 1fr) minmax(320px, 0.48fr)',
      '@media (max-width: 900px)': '1fr',
    },
    marginBlockStart: 34,
  },
});
