import * as stylex from '@stylexjs/stylex';

export const tokens = stylex.defineVars({
  accent: 'var(--color-sky-400)',
  accentMuted: 'color-mix(in oklab, var(--color-sky-400) 14%, transparent)',
  canvas: 'var(--color-slate-950)',
  line: 'color-mix(in oklab, var(--color-slate-400) 18%, transparent)',
  positive: 'var(--color-emerald-400)',
  positiveMuted: 'color-mix(in oklab, var(--color-emerald-400) 14%, transparent)',
  surface: 'var(--color-slate-900)',
  surfaceRaised: 'color-mix(in oklab, var(--color-slate-800) 78%, transparent)',
  textMuted: 'var(--color-slate-400)',
  textPrimary: 'var(--color-slate-50)',
  textSecondary: 'var(--color-slate-300)',
});
