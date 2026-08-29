import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';

import type { RuntimeInfo } from '../../../shared/desktop-api';
import { tokens } from '../../theme/tokens.stylex';

type RuntimeState =
  | { readonly status: 'loading' }
  | { readonly info: RuntimeInfo; readonly status: 'ready' }
  | { readonly status: 'error' };

export function RuntimeCard(): React.JSX.Element {
  const [state, setState] = useState<RuntimeState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;

    window.desktop.getRuntimeInfo().then(
      (info) => {
        if (isMounted) {
          setState({ info, status: 'ready' });
        }
      },
      () => {
        if (isMounted) {
          setState({ status: 'error' });
        }
      },
    );

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section {...stylex.props(styles.card)} aria-labelledby="runtime-title">
      <div {...stylex.props(styles.headingRow)}>
        <div>
          <p {...stylex.props(styles.eyebrow)}>SYSTEM</p>
          <h2 {...stylex.props(styles.title)} id="runtime-title">
            Runtime
          </h2>
        </div>
        {state.status === 'ready' && (
          <span {...stylex.props(styles.platformBadge)}>{state.info.platform}</span>
        )}
      </div>

      <div {...stylex.props(styles.content)} aria-live="polite">
        {state.status === 'loading' && (
          <div {...stylex.props(styles.stateMessage)}>
            <span {...stylex.props(styles.pulse)} aria-hidden="true" />
            런타임 확인 중
          </div>
        )}

        {state.status === 'error' && (
          <p {...stylex.props(styles.error)}>런타임 정보를 불러오지 못했습니다</p>
        )}

        {state.status === 'ready' && (
          <dl {...stylex.props(styles.versionList)}>
            {[
              ['Electron', state.info.versions.electron],
              ['Chromium', state.info.versions.chromium],
              ['Node.js', state.info.versions.node],
            ].map(([label, version]) => (
              <div {...stylex.props(styles.versionRow)} key={label}>
                <dt {...stylex.props(styles.versionLabel)}>{label}</dt>
                <dd {...stylex.props(styles.versionValue)}>{version}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

const styles = stylex.create({
  card: {
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.line,
    borderRadius: 24,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 310,
    padding: 28,
  },
  content: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  error: {
    color: tokens.textSecondary,
    fontSize: 15,
    lineHeight: 1.6,
    margin: 0,
  },
  eyebrow: {
    color: tokens.accent,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.16em',
    marginBlock: 0,
  },
  headingRow: {
    alignItems: 'flex-start',
    display: 'flex',
    justifyContent: 'space-between',
  },
  platformBadge: {
    backgroundColor: tokens.positiveMuted,
    borderRadius: 999,
    color: tokens.positive,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    paddingBlock: 7,
    paddingInline: 11,
  },
  pulse: {
    backgroundColor: tokens.accent,
    borderRadius: '50%',
    boxShadow: `0 0 0 6px ${tokens.accentMuted}`,
    height: 8,
    width: 8,
  },
  stateMessage: {
    alignItems: 'center',
    color: tokens.textSecondary,
    display: 'flex',
    fontSize: 14,
    gap: 14,
  },
  title: {
    color: tokens.textPrimary,
    fontSize: 28,
    fontWeight: 620,
    letterSpacing: '-0.04em',
    marginBlockEnd: 0,
    marginBlockStart: 8,
  },
  versionLabel: {
    color: tokens.textMuted,
    fontSize: 13,
  },
  versionList: {
    display: 'grid',
    gap: 2,
    margin: 0,
  },
  versionRow: {
    alignItems: 'center',
    borderBlockEndColor: tokens.line,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 1,
    display: 'flex',
    justifyContent: 'space-between',
    paddingBlock: 14,
  },
  versionValue: {
    color: tokens.textPrimary,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 13,
    margin: 0,
  },
});
