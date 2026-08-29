import { describe, expect, it } from 'vitest';

import { isTrustedSender } from './trusted-sender';

describe('isTrustedSender', () => {
  it('앱 문서와 origin 및 경로가 같으면 허용한다', () => {
    expect(
      isTrustedSender(
        'http://localhost:3000/main_window/index.html#settings',
        'http://localhost:3000/main_window/index.html',
      ),
    ).toBe(true);
  });

  it('같은 origin의 다른 문서는 거부한다', () => {
    expect(
      isTrustedSender(
        'http://localhost:3000/untrusted.html',
        'http://localhost:3000/main_window/index.html',
      ),
    ).toBe(false);
  });

  it('해석할 수 없는 URL은 거부한다', () => {
    expect(isTrustedSender('not-a-url', 'http://localhost:3000/main_window/index.html')).toBe(
      false,
    );
  });
});
