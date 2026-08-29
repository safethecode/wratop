import * as stylex from '@stylexjs/stylex';

import type { BrowserWindow } from '../../../shared/archive';
import { tokens } from '../../theme/tokens.stylex';

interface CurrentTabWindowProps {
  readonly onToggleTab: (tabId: string) => void;
  readonly selectedTabIds: ReadonlySet<string>;
  readonly window: BrowserWindow;
  readonly windowNumber: number;
}

function getHost(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname || parsedUrl.protocol;
  } catch {
    return url;
  }
}

export function CurrentTabWindow({
  onToggleTab,
  selectedTabIds,
  window,
  windowNumber,
}: CurrentTabWindowProps): React.JSX.Element {
  return (
    <section {...stylex.props(styles.windowGroup)} aria-labelledby={`window-${window.id}`}>
      <header {...stylex.props(styles.windowHeader)}>
        <h3 {...stylex.props(styles.windowTitle)} id={`window-${window.id}`}>
          창 {windowNumber}
        </h3>
        <span {...stylex.props(styles.windowCount)}>{window.tabs.length}</span>
      </header>

      <ul {...stylex.props(styles.tabList)}>
        {window.tabs.map((tab) => {
          const title = tab.title || '제목 없는 탭';

          return (
            <li {...stylex.props(styles.tabRow)} key={tab.id}>
              <label {...stylex.props(styles.tabLabel)}>
                <input
                  {...stylex.props(styles.checkbox)}
                  aria-label={`${title} 선택`}
                  checked={selectedTabIds.has(tab.id)}
                  onChange={() => onToggleTab(tab.id)}
                  type="checkbox"
                />
                <span {...stylex.props(styles.tabCopy)}>
                  <span {...stylex.props(styles.tabTitleRow)}>
                    {tab.active ? (
                      <span {...stylex.props(styles.activeDot)} aria-hidden="true" />
                    ) : null}
                    <span {...stylex.props(styles.tabTitle)}>{title}</span>
                  </span>
                  <span {...stylex.props(styles.tabUrl)} title={tab.url}>
                    {getHost(tab.url)}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const styles = stylex.create({
  activeDot: {
    backgroundColor: tokens.accent,
    borderRadius: '50%',
    flexShrink: 0,
    height: 5,
    width: 5,
  },
  checkbox: {
    accentColor: tokens.accent,
    flexShrink: 0,
    height: 16,
    margin: 0,
    width: 16,
  },
  tabCopy: {
    display: 'grid',
    gap: 4,
    minWidth: 0,
  },
  tabLabel: {
    alignItems: 'center',
    cursor: 'pointer',
    display: 'grid',
    gap: 13,
    gridTemplateColumns: '16px minmax(0, 1fr)',
    minHeight: 60,
    paddingBlock: 9,
    paddingInline: 20,
  },
  tabList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  tabRow: {
    ':hover': {
      backgroundColor: tokens.surfaceRaised,
    },
    borderBlockStartColor: tokens.line,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: 1,
  },
  tabTitle: {
    color: tokens.textPrimary,
    fontSize: 13,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tabTitleRow: {
    alignItems: 'center',
    display: 'flex',
    gap: 7,
    minWidth: 0,
  },
  tabUrl: {
    color: tokens.textMuted,
    fontSize: 11,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  windowCount: {
    color: tokens.textMuted,
    fontSize: 11,
  },
  windowGroup: {
    backgroundColor: tokens.surface,
  },
  windowHeader: {
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
  windowTitle: {
    color: tokens.textSecondary,
    fontSize: 11,
    fontWeight: 600,
    margin: 0,
  },
});
