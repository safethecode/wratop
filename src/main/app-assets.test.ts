import { describe, expect, it } from 'vitest';

import { resolveAppAssetPath } from './app-assets';

describe('resolveAppAssetPath', () => {
  it('개발 중에는 project assets 경로를 사용한다', () => {
    expect(
      resolveAppAssetPath('wratopStatusTemplate.png', {
        appPath: '/project',
        isPackaged: false,
        resourcesPath: '/Electron.app/Contents/Resources',
      }),
    ).toBe('/project/assets/wratopStatusTemplate.png');
  });

  it('패키지 앱에서는 Resources assets 경로를 사용한다', () => {
    expect(
      resolveAppAssetPath('wratopStatusTemplate.png', {
        appPath: '/Wratop.app/Contents/Resources/app.asar',
        isPackaged: true,
        resourcesPath: '/Wratop.app/Contents/Resources',
      }),
    ).toBe('/Wratop.app/Contents/Resources/assets/wratopStatusTemplate.png');
  });
});
