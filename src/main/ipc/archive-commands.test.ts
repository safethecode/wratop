import { describe, expect, it } from 'vitest';

import {
  parseArchiveId,
  parseArchiveTabsCommand,
  parseRestoreArchiveCommand,
} from './archive-commands';

describe('parseArchiveTabsCommand', () => {
  it('보관 명령을 검증한다', () => {
    const command = {
      closeAfterSave: true,
      name: '읽을 자료',
      selectedTabIds: ['tab-1', 'tab-2'],
    };

    expect(parseArchiveTabsCommand(command)).toEqual(command);
  });

  it.each([
    null,
    {},
    { closeAfterSave: 'true', name: '읽을 자료', selectedTabIds: ['tab-1'] },
    { closeAfterSave: true, name: 1, selectedTabIds: ['tab-1'] },
    { closeAfterSave: true, name: '읽을 자료', selectedTabIds: [] },
    { closeAfterSave: true, name: '읽을 자료', selectedTabIds: [''] },
  ])('잘못된 보관 명령을 거부한다', (value) => {
    expect(() => parseArchiveTabsCommand(value)).toThrow('Invalid archive tabs command');
  });
});

describe('parseRestoreArchiveCommand', () => {
  it('복원 명령을 검증한다', () => {
    const command = {
      archiveId: '00000000-0000-4000-8000-000000000001',
      selectedTabIds: ['tab-1'],
    };

    expect(parseRestoreArchiveCommand(command)).toEqual(command);
  });

  it.each([
    null,
    {},
    { archiveId: 'not-an-id', selectedTabIds: ['tab-1'] },
    { archiveId: '00000000-0000-4000-8000-000000000001', selectedTabIds: [] },
    { archiveId: '00000000-0000-4000-8000-000000000001', selectedTabIds: [1] },
  ])('잘못된 복원 명령을 거부한다', (value) => {
    expect(() => parseRestoreArchiveCommand(value)).toThrow('Invalid restore archive command');
  });
});

describe('parseArchiveId', () => {
  it('UUID만 허용한다', () => {
    expect(parseArchiveId('00000000-0000-4000-8000-000000000001')).toBe(
      '00000000-0000-4000-8000-000000000001',
    );
    expect(() => parseArchiveId('../archive')).toThrow('Invalid archive id');
    expect(() => parseArchiveId(1)).toThrow('Invalid archive id');
  });
});
