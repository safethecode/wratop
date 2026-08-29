import * as stylex from '@stylexjs/stylex';

export const tokens = stylex.defineVars({
  accent: 'var(--color-sky-400)',
  accentMuted: 'color-mix(in oklab, var(--color-sky-400) 14%, transparent)',
  accentStrong: 'var(--color-sky-300)',
  canvas: 'var(--color-slate-950)',
  danger: 'var(--color-rose-400)',
  dangerMuted: 'color-mix(in oklab, var(--color-rose-400) 12%, transparent)',
  line: 'color-mix(in oklab, var(--color-slate-400) 18%, transparent)',
  lineStrong: 'color-mix(in oklab, var(--color-slate-300) 28%, transparent)',
  positive: 'var(--color-emerald-400)',
  positiveMuted: 'color-mix(in oklab, var(--color-emerald-400) 14%, transparent)',
  surface: 'var(--color-slate-900)',
  surfaceMuted: 'color-mix(in oklab, var(--color-slate-900) 72%, transparent)',
  surfaceRaised: 'color-mix(in oklab, var(--color-slate-800) 78%, transparent)',
  textMuted: 'var(--color-slate-400)',
  textPrimary: 'var(--color-slate-50)',
  textSecondary: 'var(--color-slate-300)',
  warning: 'var(--color-amber-400)',
  warningMuted: 'color-mix(in oklab, var(--color-amber-400) 12%, transparent)',
});
