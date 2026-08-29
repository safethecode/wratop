import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerZIP } from '@electron-forge/maker-zip';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import type { ForgeConfig } from '@electron-forge/shared-types';

import { mainConfig } from './webpack.main.config';
import { preloadConfig } from './webpack.preload.config';
import { rendererConfig } from './webpack.renderer.config';

const hasSigningConfiguration = (osxSign: unknown): boolean => {
  if (typeof osxSign === 'object' && osxSign !== null) {
    return Object.keys(osxSign).length > 0;
  }

  return Boolean(osxSign);
};

const resolveAppBundle = async (outputPath: string): Promise<string> => {
  if (outputPath.endsWith('.app')) {
    return outputPath;
  }

  const entries = await readdir(outputPath, { withFileTypes: true });
  const appBundles = entries.filter((entry) => entry.isDirectory() && entry.name.endsWith('.app'));

  if (appBundles.length !== 1) {
    throw new Error(`Expected one app bundle in ${outputPath}, found ${appBundles.length}`);
  }

  const [appBundle] = appBundles;

  if (appBundle === undefined) {
    throw new Error(`App bundle not found in ${outputPath}`);
  }

  return path.join(outputPath, appBundle.name);
};

const flipConfiguredFuses = async (
  electronPath: string,
  resetAdHocDarwinSignature: boolean,
): Promise<void> => {
  const { flipFuses, FuseV1Options, FuseVersion } = await import('@electron/fuses');

  await flipFuses(electronPath, {
    version: FuseVersion.V1,
    strictlyRequireAllFuses: true,
    resetAdHocDarwinSignature,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableCookieEncryption]: true,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
    [FuseV1Options.GrantFileProtocolExtraPrivileges]: true,
    [FuseV1Options.WasmTrapHandlers]: true,
  });
};

const forgeConfig: ForgeConfig = {
  hooks: {
    packageAfterCopy: async (
      _resolvedForgeConfig,
      buildPath,
      _electronVersion,
      platform,
      _arch,
    ) => {
      if (platform !== 'darwin' && platform !== 'mas') {
        return;
      }

      const executablePath = path.join(path.resolve(buildPath, '../..'), 'MacOS', 'Electron');

      await flipConfiguredFuses(executablePath, false);
    },
    postPackage: async (resolvedForgeConfig, { arch, outputPaths, platform }) => {
      if (
        (platform !== 'darwin' && platform !== 'mas') ||
        arch !== 'arm64' ||
        hasSigningConfiguration(resolvedForgeConfig.packagerConfig.osxSign)
      ) {
        return;
      }

      for (const outputPath of outputPaths) {
        const appBundle = await resolveAppBundle(outputPath);
        await flipConfiguredFuses(appBundle, true);
      }
    },
  },
  makers: [new MakerDMG({}, ['darwin']), new MakerZIP({}, ['darwin'])],
  packagerConfig: {
    appBundleId: 'com.wratop.app',
    asar: true,
    executableName: 'wratop',
    extendInfo: {
      LSMinimumSystemVersion: '13.0',
      NSAppleEventsUsageDescription:
        'Chrome automation permission is required to archive and restore tabs.',
    },
  },
  plugins: [
    new WebpackPlugin({
      devContentSecurityPolicy:
        "default-src 'self'; connect-src 'self' ws://localhost:3300; img-src 'self' data:; script-src 'self'; style-src 'self'",
      loggerPort: 9300,
      mainConfig,
      packageSourceMaps: false,
      port: 3300,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/renderer/index.tsx',
            name: 'main_window',
            preload: {
              config: preloadConfig,
              js: './src/preload/index.ts',
            },
          },
        ],
      },
    }),
  ],
};

export default forgeConfig;
