import type { Configuration } from 'webpack';

import { preloadRules } from './webpack.rules';

export const preloadConfig = (
  _environment: unknown,
  { mode }: Record<string, unknown>,
): Configuration => ({
  devtool: mode === 'development' ? 'source-map' : false,
  module: {
    rules: preloadRules,
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
});
