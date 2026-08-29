import { describe, expect, it } from 'vitest';

import { ChromeAppleEventsGateway } from './chrome-apple-events';

describe('ChromeAppleEventsGateway', () => {
  it('JXA 결과에 main process의 수집 시각을 더해 현재 탭을 반환한다', async () => {
    const gateway = new ChromeAppleEventsGateway(
      async () =>
        JSON.stringify({
          excludedIncognitoWindowCount: 1,
          status: 'ok',
          windows: [
            {
              id: 'window-7',
              position: 0,
              tabs: [
                {
                  active: true,
                  id: 'tab-42',
                  position: 0,
                  title: 'Electron',
                  url: 'https://www.electronjs.org/',
                },
              ],
            },
          ],
        }),
      () => new Date('2026-08-29T04:00:00.000Z'),
    );

    await expect(gateway.captureTabs()).resolves.toEqual({
      capturedAt: '2026-08-29T04:00:00.000Z',
      excludedIncognitoWindowCount: 1,
      source: 'chrome',
      windows: [
        {
          id: 'window-7',
          position: 0,
          tabs: [
            {
              active: true,
              id: 'tab-42',
              position: 0,
              title: 'Electron',
              url: 'https://www.electronjs.org/',
            },
          ],
        },
      ],
    });
  });

  it('Chrome이 실행 중이 아니면 사용자가 이해할 수 있는 오류를 반환한다', async () => {
    const gateway = new ChromeAppleEventsGateway(
      async () => JSON.stringify({ status: 'not-running' }),
      () => new Date('2026-08-29T04:00:00.000Z'),
    );

    await expect(gateway.captureTabs()).rejects.toThrow('Chrome이 실행 중이 아닙니다');
  });

  it('필수 탭 정보가 빠진 JXA 응답을 거부한다', async () => {
    const gateway = new ChromeAppleEventsGateway(async () =>
      JSON.stringify({
        excludedIncognitoWindowCount: 0,
        status: 'ok',
        windows: [{ id: 'window-1', position: 0, tabs: [{}] }],
      }),
    );

    await expect(gateway.captureTabs()).rejects.toThrow('Chrome 탭 응답이 올바르지 않습니다');
  });

  it('탭 ID와 예상 URL을 JXA에 전달하고 닫기 결과를 반환한다', async () => {
    let receivedArguments: readonly string[] = [];
    const gateway = new ChromeAppleEventsGateway(async (_script, arguments_) => {
      receivedArguments = arguments_;
      return JSON.stringify({ closedTabCount: 1, skippedTabCount: 1 });
    });

    await expect(
      gateway.closeTabs([
        {
          expectedUrl: 'https://www.electronjs.org/',
          tabId: 'tab-42',
          windowId: 'window-7',
        },
        {
          expectedUrl: 'https://stylexjs.com/',
          tabId: 'tab-43',
          windowId: 'window-7',
        },
      ]),
    ).resolves.toEqual({ closedTabCount: 1, skippedTabCount: 1 });
    expect(JSON.parse(receivedArguments[0] ?? '')).toEqual([
      {
        expectedUrl: 'https://www.electronjs.org/',
        tabId: 'tab-42',
        windowId: 'window-7',
      },
      {
        expectedUrl: 'https://stylexjs.com/',
        tabId: 'tab-43',
        windowId: 'window-7',
      },
    ]);
  });

  it('음수 카운트가 포함된 닫기 응답을 거부한다', async () => {
    const gateway = new ChromeAppleEventsGateway(async () =>
      JSON.stringify({ closedTabCount: -1, skippedTabCount: 0 }),
    );

    await expect(gateway.closeTabs([])).rejects.toThrow('Chrome 탭 닫기 응답이 올바르지 않습니다');
  });

  it('복원할 탭을 URL과 활성 위치만 담은 창 payload로 전달한다', async () => {
    let receivedArguments: readonly string[] = [];
    const gateway = new ChromeAppleEventsGateway(async (_script, arguments_) => {
      receivedArguments = arguments_;
      return '';
    });

    await gateway.restoreWindows([
      {
        id: 'archived-window',
        position: 0,
        tabs: [
          {
            active: false,
            id: 'archived-tab-1',
            position: 0,
            title: 'Electron',
            url: 'https://www.electronjs.org/',
          },
          {
            active: true,
            id: 'archived-tab-2',
            position: 1,
            title: 'StyleX',
            url: 'https://stylexjs.com/',
          },
        ],
      },
    ]);

    expect(JSON.parse(receivedArguments[0] ?? '')).toEqual([
      {
        activePosition: 1,
        urls: ['https://www.electronjs.org/', 'https://stylexjs.com/'],
      },
    ]);
  });
});
