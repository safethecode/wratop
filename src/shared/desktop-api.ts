import type {
  ArchiveTabsCommand,
  ArchiveTabsResult,
  BrowserSnapshot,
  RestoreArchiveCommand,
  RestoreArchiveResult,
  TabArchive,
  TabArchiveSummary,
} from './archive';

export const IPC_CHANNELS = {
  archiveTabs: 'archive:create',
  captureTabs: 'archive:capture-tabs',
  deleteArchive: 'archive:delete',
  getArchive: 'archive:get',
  getRuntimeInfo: 'desktop:get-runtime-info',
  listArchives: 'archive:list',
  restoreArchive: 'archive:restore',
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
  archiveTabs(command: ArchiveTabsCommand): Promise<ArchiveTabsResult>;
  captureTabs(): Promise<BrowserSnapshot>;
  deleteArchive(id: string): Promise<boolean>;
  getArchive(id: string): Promise<TabArchive | null>;
  getRuntimeInfo(): Promise<RuntimeInfo>;
  listArchives(): Promise<readonly TabArchiveSummary[]>;
  restoreArchive(command: RestoreArchiveCommand): Promise<RestoreArchiveResult>;
}
