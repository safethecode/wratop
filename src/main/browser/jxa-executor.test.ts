import { describe, expect, it } from 'vitest';

import { executeJxa } from './jxa-executor';

describe('executeJxa', () => {
  it('shell 해석 없이 JXA 인자를 그대로 전달한다', async () => {
    const script = 'function run(argv) { return JSON.stringify(argv); }';

    await expect(executeJxa(script, ['first value', '둘째 값'])).resolves.toBe(
      '["first value","둘째 값"]',
    );
  });
});
