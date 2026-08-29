import path from 'node:path';

interface AppAssetRuntime {
  readonly appPath: string;
  readonly isPackaged: boolean;
  readonly resourcesPath: string;
}

export function resolveAppAssetPath(fileName: string, runtime: AppAssetRuntime): string {
  const assetDirectory = runtime.isPackaged
    ? path.join(runtime.resourcesPath, 'assets')
    : path.join(runtime.appPath, 'assets');

  return path.join(assetDirectory, fileName);
}
