import * as stylex from '@stylexjs/stylex';

import type { BrowserWindow } from '../../../shared/archive';
import { tokens } from '../../theme/tokens.stylex';

interface ArchiveWindowGroupProps {
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

export function ArchiveWindowGroup({
  onToggleTab,
  selectedTabIds,
  window,
  windowNumber,
}: ArchiveWindowGroupProps): React.JSX.Element {
  return (
    <section {...stylex.props(styles.group)} aria-labelledby={`archive-window-${window.id}`}>
      <h4 {...stylex.props(styles.windowTitle)} id={`archive-window-${window.id}`}>
        창 {windowNumber} · {window.tabs.length}개
      </h4>
      <ul {...stylex.props(styles.tabList)}>
        {window.tabs.map((tab) => (
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
                <span {...stylex.props(styles.tabTitle)}>{tab.title || '제목 없는 탭'}</span>
                <span {...stylex.props(styles.tabHost)}>{getHost(tab.url)}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}

const styles = stylex.create({
  checkbox: {
    accentColor: tokens.accent,
    flexShrink: 0,
    height: 15,
    margin: 0,
    width: 15,
  },
  group: {
    backgroundColor: tokens.canvas,
    borderColor: tokens.line,
    borderRadius: 12,
    borderStyle: 'solid',
    borderWidth: 1,
    overflow: 'hidden',
  },
  tabCopy: {
    display: 'grid',
    gap: 4,
    minWidth: 0,
  },
  tabHost: {
    color: tokens.textMuted,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 9,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tabLabel: {
    alignItems: 'flex-start',
    cursor: 'pointer',
    display: 'grid',
    gap: 10,
    gridTemplateColumns: '15px minmax(0, 1fr)',
    paddingBlock: 11,
    paddingInline: 12,
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
    color: tokens.textSecondary,
    fontSize: 11,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  windowTitle: {
    color: tokens.textMuted,
    fontSize: 10,
    fontWeight: 650,
    margin: 0,
    paddingBlock: 9,
    paddingInline: 12,
  },
});
