import { describe, expect, it } from 'vitest';

import { executeJxa } from './jxa-executor';

describe('executeJxa', () => {
  it('shell 해석 없이 JXA 인자를 그대로 전달한다', async () => {
    const script = 'function run(argv) { return JSON.stringify(argv); }';

    await expect(executeJxa(script, ['first value', '둘째 값'])).resolves.toBe(
      '["first value","둘째 값"]',
    );
  });

  it('제한 시간 안에 끝나지 않은 JXA 실행을 중단한다', async () => {
    const executeJxaWithTimeout = executeJxa as (
      script: string,
      arguments_: readonly string[],
      timeoutMs: number,
    ) => Promise<string>;
    const script = 'function run() { delay(0.2); return "done"; }';

    await expect(executeJxaWithTimeout(script, [], 10)).rejects.toThrow(
      'Chrome did not respond. Try again.',
    );
  });
});
