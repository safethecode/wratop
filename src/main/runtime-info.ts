import type { RuntimeInfo } from '../shared/desktop-api';

interface RuntimeInfoSource {
  readonly platform: NodeJS.Platform;
  readonly versions: {
    readonly chrome: string;
    readonly electron: string;
    readonly node: string;
  };
}

export function createRuntimeInfo(source: RuntimeInfoSource): RuntimeInfo {
  return {
    platform: source.platform,
    versions: {
      chromium: source.versions.chrome,
      electron: source.versions.electron,
      node: source.versions.node,
    },
  };
}
