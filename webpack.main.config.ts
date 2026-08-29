import type { Configuration } from 'webpack';

import { mainRules } from './webpack.rules';

export const mainConfig = (
  _environment: unknown,
  { mode }: Record<string, unknown>,
): Configuration => ({
  devtool: mode === 'development' ? 'source-map' : false,
  entry: './src/main/index.ts',
  module: {
    rules: mainRules,
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
});
