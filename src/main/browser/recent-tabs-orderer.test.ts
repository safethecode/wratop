// @vitest-environment node

import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type { BrowserSnapshot } from '../../shared/archive';
import { RecentTabsOrderer } from './recent-tabs-orderer';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  for (const directoryPath of temporaryDirectories.splice(0)) {
    await rm(directoryPath, { force: true, recursive: true });
  }
});

async function createMetadataPath(): Promise<string> {
  const directoryPath = await mkdtemp(path.join(tmpdir(), 'wratop-recent-tabs-'));
  temporaryDirectories.push(directoryPath);
  return path.join(directoryPath, 'tab-recency.json');
}

function createSnapshot(tabIds: readonly string[]): BrowserSnapshot {
  return {
    capturedAt: '2026-08-30T01:00:00.000Z',
    excludedIncognitoWindowCount: 0,
    source: 'chrome',
    windows: [
      {
        id: 'window-1',
        position: 0,
        tabs: tabIds.map((id, position) => ({
          active: position === 0,
          id,
          position,
          title: id,
          url: `https://example.com/${id}`,
        })),
      },
    ],
  };
}

function getFirstWindowTabIds(snapshot: BrowserSnapshot): readonly string[] {
  return snapshot.windows[0]?.tabs.map((tab) => tab.id) ?? [];
}

describe('RecentTabsOrderer', () => {
  it('처음 확인한 기존 순서를 유지하고 나중에 발견한 탭을 앞으로 옮긴다', async () => {
    let currentTime = 1_000;
    const orderer = new RecentTabsOrderer(await createMetadataPath(), () => currentTime);

    const initialSnapshot = await orderer.order(createSnapshot(['tab-1', 'tab-2']));
    currentTime = 2_000;
    const updatedSnapshot = await orderer.order(createSnapshot(['tab-1', 'tab-3', 'tab-2']));

    expect(getFirstWindowTabIds(initialSnapshot)).toEqual(['tab-1', 'tab-2']);
    expect(getFirstWindowTabIds(updatedSnapshot)).toEqual(['tab-3', 'tab-1', 'tab-2']);
  });

  it('앱을 다시 열어도 발견 시각을 불러와 같은 순서로 정렬한다', async () => {
    let currentTime = 1_000;
    const metadataPath = await createMetadataPath();
    const firstOrderer = new RecentTabsOrderer(metadataPath, () => currentTime);

    await firstOrderer.order(createSnapshot(['tab-1']));
    currentTime = 2_000;
    await firstOrderer.order(createSnapshot(['tab-1', 'tab-2']));

    const restartedOrderer = new RecentTabsOrderer(metadataPath, () => 3_000);
    const reorderedSnapshot = await restartedOrderer.order(createSnapshot(['tab-1', 'tab-2']));

    expect(getFirstWindowTabIds(reorderedSnapshot)).toEqual(['tab-2', 'tab-1']);
  });

  it('metadata 저장이 실패하면 다음 탭 확인에서 다시 저장한다', async () => {
    const directoryPath = await mkdtemp(path.join(tmpdir(), 'wratop-recent-tabs-'));
    temporaryDirectories.push(directoryPath);
    const blockedDirectoryPath = path.join(directoryPath, 'blocked');
    const metadataPath = path.join(blockedDirectoryPath, 'tab-recency.json');
    await writeFile(blockedDirectoryPath, 'blocks directory creation');
    const orderer = new RecentTabsOrderer(metadataPath, () => 1_000);

    await orderer.order(createSnapshot(['tab-1']));
    await rm(blockedDirectoryPath);
    await mkdir(blockedDirectoryPath);
    await orderer.order(createSnapshot(['tab-1']));

    const storedMetadata = JSON.parse(await readFile(metadataPath, 'utf8')) as {
      readonly firstSeenAtByTabId: Readonly<Record<string, number>>;
    };
    expect(storedMetadata.firstSeenAtByTabId['tab-1']).toBe(1_000);
  });
});
