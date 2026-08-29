import type { MenuItemConstructorOptions } from 'electron';
import { Menu, nativeImage, Tray } from 'electron';

import type { BrowserSnapshot } from '../shared/archive';

interface CreateStatusBarOptions {
  readonly captureTabs: () => Promise<BrowserSnapshot>;
  readonly iconPath: string;
  readonly openWindow: () => void;
  readonly quit: () => void;
}

export interface StatusBar {
  readonly destroy: () => void;
  readonly refresh: () => Promise<void>;
}

type StatusBarState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly snapshot: BrowserSnapshot; readonly status: 'ready' };

const refreshIntervalMs = 60_000;

function formatCount(count: number, singular: string): string {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

function countTabs(snapshot: BrowserSnapshot): number {
  return snapshot.windows.reduce((count, window) => count + window.tabs.length, 0);
}

export function createStatusBar(options: CreateStatusBarOptions): StatusBar {
  const icon = nativeImage.createFromPath(options.iconPath);
  icon.setTemplateImage(true);
  const tray = new Tray(icon);
  let currentRefresh: Promise<void> | null = null;
  let isDestroyed = false;
  let state: StatusBarState = { status: 'loading' };

  const render = (): void => {
    const menuTemplate: MenuItemConstructorOptions[] = [];

    switch (state.status) {
      case 'loading':
        tray.setTitle('');
        tray.setToolTip('Wratop');
        menuTemplate.push({ enabled: false, label: 'Loading…' });
        break;
      case 'error':
        tray.setTitle('');
        tray.setToolTip('Wratop — Chrome unavailable');
        menuTemplate.push({ enabled: false, label: 'Chrome Tabs Unavailable' });
        break;
      case 'ready': {
        const tabCount = countTabs(state.snapshot);
        const windowCount = state.snapshot.windows.length;
        tray.setTitle(String(tabCount), { fontType: 'monospacedDigit' });
        tray.setToolTip(`Wratop — ${tabCount} ${tabCount === 1 ? 'tab' : 'tabs'}`);
        menuTemplate.push({
          enabled: false,
          label: `${formatCount(tabCount, 'Tab')} · ${formatCount(windowCount, 'Window')}`,
        });
        break;
      }
    }

    menuTemplate.push(
      {
        click: () => {
          void refresh();
        },
        label: 'Refresh',
      },
      { type: 'separator' },
      { click: options.openWindow, label: 'View Wratop' },
      { click: options.quit, label: 'Quit Wratop' },
    );
    tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
  };

  const refresh = (): Promise<void> => {
    if (isDestroyed) {
      return Promise.resolve();
    }

    if (currentRefresh !== null) {
      return currentRefresh;
    }

    if (state.status !== 'ready') {
      state = { status: 'loading' };
      render();
    }

    const nextRefresh = Promise.resolve()
      .then(options.captureTabs)
      .then(
        (snapshot) => {
          if (!isDestroyed) {
            state = { snapshot, status: 'ready' };
            render();
          }
        },
        () => {
          if (!isDestroyed) {
            state = { status: 'error' };
            render();
          }
        },
      )
      .finally(() => {
        if (currentRefresh === nextRefresh) {
          currentRefresh = null;
        }
      });

    currentRefresh = nextRefresh;
    return nextRefresh;
  };

  render();
  void refresh();
  const refreshInterval = setInterval(() => {
    void refresh();
  }, refreshIntervalMs);

  return {
    destroy: () => {
      isDestroyed = true;
      clearInterval(refreshInterval);
      tray.destroy();
    },
    refresh,
  };
}
