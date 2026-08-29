import * as stylex from '@stylexjs/stylex';

import { RuntimeCard } from '../features/runtime/RuntimeCard';
import { tokens } from '../theme/tokens.stylex';

const boundaries = [
  { detail: '앱 생명주기와 OS 권한', layer: 'main' },
  { detail: '허용한 API만 전달', layer: 'preload' },
  { detail: '공유 타입과 IPC 채널', layer: 'shared' },
  { detail: 'React와 StyleX UI', layer: 'renderer' },
] as const;

export function App(): React.JSX.Element {
  return (
    <main {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.brand)}>
          <span {...stylex.props(styles.brandMark)} aria-hidden="true" />
          <span>wratop</span>
        </div>
        <div {...stylex.props(styles.secureStatus)}>
          <span {...stylex.props(styles.statusDot)} aria-hidden="true" />
          Sandboxed renderer
        </div>
      </header>

      <section {...stylex.props(styles.hero)} aria-labelledby="hero-title">
        <p {...stylex.props(styles.eyebrow)}>ELECTRON FOUNDATION</p>
        <h1 {...stylex.props(styles.heroTitle)} id="hero-title">
          앱 기능에 집중할 수 있는
          <br />
          단단한 시작점
        </h1>
        <p {...stylex.props(styles.heroCopy)}>
          프로세스 경계와 개발 규칙은 엄격하게, 폴더 구조와 추상화는 필요한 만큼만 구성했습니다.
        </p>
        <ul {...stylex.props(styles.tags)} aria-label="기술 구성">
          <li {...stylex.props(styles.tag)}>Typed IPC</li>
          <li {...stylex.props(styles.tag)}>Strict TypeScript</li>
          <li {...stylex.props(styles.tag)}>StyleX</li>
          <li {...stylex.props(styles.tag)}>Tailwind colors</li>
        </ul>
      </section>

      <div {...stylex.props(styles.dashboard)}>
        <RuntimeCard />

        <section {...stylex.props(styles.architectureCard)} aria-labelledby="architecture-title">
          <div>
            <p {...stylex.props(styles.eyebrow)}>BOUNDARIES</p>
            <h2 {...stylex.props(styles.cardTitle)} id="architecture-title">
              Architecture
            </h2>
          </div>

          <ol {...stylex.props(styles.boundaryList)}>
            {boundaries.map(({ detail, layer }, index) => (
              <li {...stylex.props(styles.boundaryItem)} key={layer}>
                <span {...stylex.props(styles.boundaryIndex)}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <strong {...stylex.props(styles.boundaryLayer)}>{layer}</strong>
                  <p {...stylex.props(styles.boundaryDetail)}>{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}

const styles = stylex.create({
  architectureCard: {
    backgroundColor: tokens.surface,
    borderColor: tokens.line,
    borderRadius: 24,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 310,
    padding: 28,
  },
  boundaryDetail: {
    color: tokens.textMuted,
    fontSize: 12,
    marginBlockEnd: 0,
    marginBlockStart: 4,
  },
  boundaryIndex: {
    color: tokens.accent,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    paddingBlockStart: 2,
  },
  boundaryItem: {
    alignItems: 'flex-start',
    borderBlockEndColor: tokens.line,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 1,
    display: 'grid',
    gap: 16,
    gridTemplateColumns: '24px 1fr',
    paddingBlock: 12,
  },
  boundaryLayer: {
    color: tokens.textPrimary,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 13,
    fontWeight: 580,
  },
  boundaryList: {
    display: 'grid',
    listStyle: 'none',
    marginBlockEnd: 0,
    marginBlockStart: 22,
    padding: 0,
  },
  brand: {
    alignItems: 'center',
    color: tokens.textPrimary,
    display: 'flex',
    fontSize: 15,
    fontWeight: 650,
    gap: 10,
    letterSpacing: '-0.02em',
  },
  brandMark: {
    backgroundColor: tokens.accent,
    borderRadius: 4,
    boxShadow: `0 0 24px ${tokens.accent}`,
    height: 12,
    transform: 'rotate(12deg)',
    width: 12,
  },
  cardTitle: {
    color: tokens.textPrimary,
    fontSize: 28,
    fontWeight: 620,
    letterSpacing: '-0.04em',
    marginBlockEnd: 0,
    marginBlockStart: 8,
  },
  dashboard: {
    display: 'grid',
    gap: 18,
    gridTemplateColumns: 'minmax(0, 1.08fr) minmax(320px, 0.92fr)',
    marginBlockStart: 52,
  },
  eyebrow: {
    color: tokens.accent,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.16em',
    margin: 0,
  },
  header: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
  hero: {
    marginBlockStart: 86,
    maxWidth: 780,
  },
  heroCopy: {
    color: tokens.textSecondary,
    fontSize: 16,
    lineHeight: 1.75,
    marginBlockEnd: 0,
    marginBlockStart: 24,
    maxWidth: 620,
  },
  heroTitle: {
    color: tokens.textPrimary,
    fontSize: 'clamp(44px, 7vw, 72px)',
    fontWeight: 640,
    letterSpacing: '-0.065em',
    lineHeight: 1.04,
    marginBlockEnd: 0,
    marginBlockStart: 14,
  },
  page: {
    marginInline: 'auto',
    maxWidth: 1080,
    minHeight: '100vh',
    paddingBlock: 36,
    paddingInline: 42,
  },
  secureStatus: {
    alignItems: 'center',
    color: tokens.textMuted,
    display: 'flex',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    gap: 9,
  },
  statusDot: {
    backgroundColor: tokens.positive,
    borderRadius: '50%',
    boxShadow: `0 0 12px ${tokens.positive}`,
    height: 6,
    width: 6,
  },
  tag: {
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.line,
    borderRadius: 999,
    borderStyle: 'solid',
    borderWidth: 1,
    color: tokens.textSecondary,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    paddingBlock: 8,
    paddingInline: 12,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    listStyle: 'none',
    marginBlockEnd: 0,
    marginBlockStart: 28,
    padding: 0,
  },
});
