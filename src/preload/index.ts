import { contextBridge, ipcRenderer } from 'electron';
import type { DesktopApi } from '../shared/desktop-api';
import { IPC_CHANNELS } from '../shared/desktop-api';

const desktopApi: DesktopApi = {
  getRuntimeInfo: () => ipcRenderer.invoke(IPC_CHANNELS.getRuntimeInfo),
};

contextBridge.exposeInMainWorld('desktop', desktopApi);
