import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopApi } from '../shared/desktop-api';
import { IPC_CHANNELS } from '../shared/desktop-api';

const desktopApi: DesktopApi = {
  archiveTabs: (command) => ipcRenderer.invoke(IPC_CHANNELS.archiveTabs, command),
  captureTabs: () => ipcRenderer.invoke(IPC_CHANNELS.captureTabs),
  deleteArchive: (id) => ipcRenderer.invoke(IPC_CHANNELS.deleteArchive, id),
  getArchive: (id) => ipcRenderer.invoke(IPC_CHANNELS.getArchive, id),
  getRuntimeInfo: () => ipcRenderer.invoke(IPC_CHANNELS.getRuntimeInfo),
  listArchives: () => ipcRenderer.invoke(IPC_CHANNELS.listArchives),
  restoreArchive: (command) => ipcRenderer.invoke(IPC_CHANNELS.restoreArchive, command),
};

contextBridge.exposeInMainWorld('desktop', desktopApi);
