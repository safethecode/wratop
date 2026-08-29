import path from 'node:path';

import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import type { RuleSetRule } from 'webpack';

const sourcePath = path.resolve(__dirname, 'src');

export const mainRules: RuleSetRule[] = [
  {
    exclude: /node_modules/,
    include: [path.join(sourcePath, 'main'), path.join(sourcePath, 'shared')],
    test: /\.tsx?$/,
    use: {
      loader: 'ts-loader',
      options: {
        configFile: 'tsconfig.main.json',
        transpileOnly: true,
      },
    },
  },
];

export const preloadRules: RuleSetRule[] = [
  {
    exclude: /node_modules/,
    include: [path.join(sourcePath, 'preload'), path.join(sourcePath, 'shared')],
    test: /\.ts$/,
    use: {
      loader: 'ts-loader',
      options: {
        configFile: 'tsconfig.main.json',
        transpileOnly: true,
      },
    },
  },
];

export const rendererRules: RuleSetRule[] = [
  {
    exclude: /node_modules/,
    include: [path.join(sourcePath, 'renderer'), path.join(sourcePath, 'shared')],
    test: /\.tsx?$/,
    use: {
      loader: 'ts-loader',
      options: {
        configFile: 'tsconfig.renderer.json',
        transpileOnly: true,
      },
    },
  },
  {
    test: /\.css$/,
    use: [
      MiniCssExtractPlugin.loader,
      {
        loader: 'css-loader',
        options: {
          importLoaders: 1,
        },
      },
      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: {
              '@tailwindcss/postcss': {},
            },
          },
        },
      },
    ],
  },
];
