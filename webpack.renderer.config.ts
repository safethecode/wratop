import stylex from '@stylexjs/unplugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import type { Configuration } from 'webpack';

import { rendererRules } from './webpack.rules';

export const rendererConfig = (
  _environment: unknown,
  { mode }: Record<string, unknown>,
): Configuration => ({
  devtool: mode === 'development' ? 'source-map' : false,
  module: {
    rules: rendererRules,
  },
  plugins: [
    stylex.webpack({
      dev: mode === 'development',
      treeshakeCompensation: true,
      useCSSLayers: {
        before: ['theme', 'base'],
        prefix: 'stylex',
      },
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
});
