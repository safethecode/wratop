// @vitest-environment node

import { randomUUID } from 'node:crypto';

import { expect, it } from 'vitest';

import type { BrowserSnapshot } from '../../shared/archive';
import type { BrowserTabTarget } from './browser-gateway';
import { ChromeAppleEventsGateway } from './chrome-apple-events';
import { executeJxa } from './jxa-executor';

function findVerificationTargets(
  snapshot: BrowserSnapshot,
  verificationMarker: string,
): readonly BrowserTabTarget[] {
  return snapshot.windows.flatMap((window) =>
    window.tabs.flatMap((tab) =>
      tab.url.includes(verificationMarker)
        ? [{ expectedUrl: tab.url, tabId: tab.id, windowId: window.id }]
        : [],
    ),
  );
}

it('임시 창을 복원한 다음 정확한 탭만 닫는다', async (context) => {
  const { WRATOP_CHROME_INTEGRATION: chromeIntegration } = process.env;

  if (chromeIntegration !== '1') {
    context.skip();
  }

  const gateway = new ChromeAppleEventsGateway(executeJxa);
  const verificationMarker = `wratop-verification-${randomUUID()}`;

  try {
    await gateway.restoreWindows([
      {
        id: 'verification-window-1',
        position: 0,
        tabs: [
          {
            active: true,
            id: 'verification-tab-1',
            position: 0,
            title: 'wratop verification',
            url: `about:blank#${verificationMarker}-1`,
          },
        ],
      },
      {
        id: 'verification-window-2',
        position: 1,
        tabs: [
          {
            active: true,
            id: 'verification-tab-2',
            position: 0,
            title: 'wratop verification',
            url: `about:blank#${verificationMarker}-2`,
          },
        ],
      },
    ]);

    const restoredSnapshot = await gateway.captureTabs();
    const targets = findVerificationTargets(restoredSnapshot, verificationMarker);

    expect(targets).toHaveLength(2);
    await expect(gateway.closeTabs(targets)).resolves.toEqual({
      closedTabCount: 2,
      skippedTabCount: 0,
    });

    const closedSnapshot = await gateway.captureTabs();
    expect(findVerificationTargets(closedSnapshot, verificationMarker)).toHaveLength(0);
  } finally {
    const remainingSnapshot = await gateway.captureTabs();
    const remainingTargets = findVerificationTargets(remainingSnapshot, verificationMarker);

    for (const target of remainingTargets) {
      await gateway.closeTabs([target]);
    }
  }
}, 30_000);
