export const IPC_CHANNELS = {
  getRuntimeInfo: 'desktop:get-runtime-info',
} as const;

export interface RuntimeInfo {
  readonly platform: string;
  readonly versions: {
    readonly chromium: string;
    readonly electron: string;
    readonly node: string;
  };
}

export interface DesktopApi {
  getRuntimeInfo(): Promise<RuntimeInfo>;
}
