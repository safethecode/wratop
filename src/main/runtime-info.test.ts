import { describe, expect, it } from 'vitest';

import { createRuntimeInfo } from './runtime-info';

describe('createRuntimeInfo', () => {
  it('Electron의 런타임 값을 renderer 계약으로 변환한다', () => {
    expect(
      createRuntimeInfo({
        platform: 'darwin',
        versions: {
          chrome: '152.0.7977.54',
          electron: '44.0.0',
          node: '24.18.1',
        },
      }),
    ).toEqual({
      platform: 'darwin',
      versions: {
        chromium: '152.0.7977.54',
        electron: '44.0.0',
        node: '24.18.1',
      },
    });
  });
});
