import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { FileArchiveRepository } from './archive-repository';

const firstTab = {
  active: true,
  id: 'tab-1',
  position: 0,
  title: 'Electron',
  url: 'https://www.electronjs.org/',
};

const firstArchive = {
  createdAt: '2026-08-29T01:00:00.000Z',
  id: '00000000-0000-4000-8000-000000000001',
  name: '금요일 조사',
  source: 'chrome' as const,
  windows: [
    {
      id: 'window-1',
      position: 0,
      tabs: [firstTab],
    },
  ],
};

const secondArchive = {
  ...firstArchive,
  createdAt: '2026-08-29T02:00:00.000Z',
  id: '00000000-0000-4000-8000-000000000002',
  name: '토요일 읽을거리',
  windows: [
    {
      id: 'window-2',
      position: 0,
      tabs: [
        firstTab,
        {
          active: false,
          id: 'tab-2',
          position: 1,
          title: 'StyleX',
          url: 'https://stylexjs.com/',
        },
      ],
    },
  ],
};

describe('FileArchiveRepository', () => {
  let directoryPath = '';

  beforeEach(async () => {
    directoryPath = await mkdtemp(path.join(tmpdir(), 'wratop-archive-'));
  });

  afterEach(async () => {
    await rm(directoryPath, { force: true, recursive: true });
  });

  it('완성된 JSON 파일만 남기고 저장한 아카이브를 그대로 읽는다', async () => {
    const repository = new FileArchiveRepository(directoryPath);

    await repository.save(firstArchive);

    expect(await repository.get(firstArchive.id)).toEqual(firstArchive);
    expect(await readdir(directoryPath)).toEqual([`${firstArchive.id}.json`]);
  });

  it('아카이브 요약을 최신순으로 반환한다', async () => {
    const repository = new FileArchiveRepository(directoryPath);
    await repository.save(firstArchive);
    await repository.save(secondArchive);

    expect(await repository.list()).toEqual([
      {
        createdAt: '2026-08-29T02:00:00.000Z',
        id: '00000000-0000-4000-8000-000000000002',
        name: '토요일 읽을거리',
        tabCount: 2,
        windowCount: 1,
      },
      {
        createdAt: '2026-08-29T01:00:00.000Z',
        id: '00000000-0000-4000-8000-000000000001',
        name: '금요일 조사',
        tabCount: 1,
        windowCount: 1,
      },
    ]);
  });

  it('경로로 해석될 수 있는 아카이브 ID를 거부한다', async () => {
    const repository = new FileArchiveRepository(directoryPath);

    await expect(repository.get('../outside')).rejects.toThrow('Invalid archive ID');
  });

  it('저장된 아카이브를 삭제하고 존재 여부를 반환한다', async () => {
    const repository = new FileArchiveRepository(directoryPath);
    await repository.save(firstArchive);

    expect(await repository.delete(firstArchive.id)).toBe(true);
    expect(await repository.get(firstArchive.id)).toBeNull();
    expect(await repository.delete(firstArchive.id)).toBe(false);
  });

  it('필수 탭 정보가 빠진 아카이브 파일을 거부한다', async () => {
    const repository = new FileArchiveRepository(directoryPath);
    const archivePath = path.join(directoryPath, `${firstArchive.id}.json`);
    await writeFile(
      archivePath,
      JSON.stringify({ ...firstArchive, windows: [{ id: 'window-1', tabs: [{}] }] }),
    );

    await expect(repository.get(firstArchive.id)).rejects.toThrow('Invalid archive data');
  });
});
