import * as stylex from '@stylexjs/stylex';

import type { BrowserWindow } from '../../../shared/archive';
import { tokens } from '../../theme/tokens.stylex';

interface CurrentTabWindowProps {
  readonly duplicateUrlCounts: ReadonlyMap<string, number>;
  readonly onToggleTab: (tabId: string) => void;
  readonly selectedTabIds: ReadonlySet<string>;
  readonly window: BrowserWindow;
  readonly windowNumber: number;
}

function getHost(url: string): string {
  try {
    return new URL(url).hostname || new URL(url).protocol;
  } catch {
    return url;
  }
}

export function CurrentTabWindow({
  duplicateUrlCounts,
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
        <span {...stylex.props(styles.windowCount)}>{window.tabs.length}개 탭</span>
      </header>

      <ul {...stylex.props(styles.tabList)}>
        {window.tabs.map((tab) => {
          const duplicateCount = duplicateUrlCounts.get(tab.url) ?? 0;

          return (
            <li {...stylex.props(styles.tabRow)} key={tab.id}>
              <label {...stylex.props(styles.tabLabel)}>
                <input
                  {...stylex.props(styles.checkbox)}
                  aria-label={`${tab.title} 선택`}
                  checked={selectedTabIds.has(tab.id)}
                  onChange={() => onToggleTab(tab.id)}
                  type="checkbox"
                />
                <span {...stylex.props(styles.tabCopy)}>
                  <span {...stylex.props(styles.tabTitleRow)}>
                    <span {...stylex.props(styles.tabTitle)}>{tab.title || '제목 없는 탭'}</span>
                    {tab.active ? <span {...stylex.props(styles.activeBadge)}>현재 탭</span> : null}
                    {duplicateCount > 1 ? (
                      <span {...stylex.props(styles.duplicateBadge)}>
                        같은 주소 {duplicateCount}개
                      </span>
                    ) : null}
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
  activeBadge: {
    backgroundColor: tokens.accentMuted,
    borderRadius: 999,
    color: tokens.accent,
    flexShrink: 0,
    fontSize: 10,
    fontWeight: 650,
    paddingBlock: 3,
    paddingInline: 7,
  },
  checkbox: {
    accentColor: tokens.accent,
    flexShrink: 0,
    height: 16,
    margin: 0,
    width: 16,
  },
  duplicateBadge: {
    backgroundColor: tokens.warningMuted,
    borderRadius: 999,
    color: tokens.warning,
    flexShrink: 0,
    fontSize: 10,
    fontWeight: 650,
    paddingBlock: 3,
    paddingInline: 7,
  },
  tabCopy: {
    display: 'grid',
    gap: 5,
    minWidth: 0,
  },
  tabLabel: {
    alignItems: 'flex-start',
    cursor: 'pointer',
    display: 'grid',
    gap: 12,
    gridTemplateColumns: '16px minmax(0, 1fr)',
    paddingBlock: 13,
    paddingInline: 15,
  },
  tabList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  tabRow: {
    borderBlockStartColor: tokens.line,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: 1,
  },
  tabTitle: {
    color: tokens.textPrimary,
    fontSize: 13,
    fontWeight: 540,
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
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 10,
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
    borderColor: tokens.line,
    borderRadius: 15,
    borderStyle: 'solid',
    borderWidth: 1,
    overflow: 'hidden',
  },
  windowHeader: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    paddingBlock: 11,
    paddingInline: 15,
  },
  windowTitle: {
    color: tokens.textSecondary,
    fontSize: 12,
    fontWeight: 650,
    margin: 0,
  },
});
