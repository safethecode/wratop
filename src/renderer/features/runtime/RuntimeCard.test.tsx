import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RuntimeCard } from './RuntimeCard';

describe('RuntimeCard', () => {
  it('preload에서 받은 런타임 버전을 표시한다', async () => {
    Object.defineProperty(window, 'desktop', {
      configurable: true,
      value: {
        getRuntimeInfo: async () => ({
          platform: 'darwin',
          versions: {
            chromium: '152.0.7977.54',
            electron: '44.0.0',
            node: '24.18.1',
          },
        }),
      },
    });

    render(<RuntimeCard />);

    expect(screen.getByText('Checking runtime…')).toBeInTheDocument();
    expect(await screen.findByText('44.0.0')).toBeInTheDocument();
    expect(screen.getByText('152.0.7977.54')).toBeInTheDocument();
    expect(screen.getByText('24.18.1')).toBeInTheDocument();
  });

  it('preload 요청이 실패하면 오류 상태를 표시한다', async () => {
    Object.defineProperty(window, 'desktop', {
      configurable: true,
      value: {
        getRuntimeInfo: async () => Promise.reject(new Error('IPC failed')),
      },
    });

    render(<RuntimeCard />);

    expect(await screen.findByText('Could not load runtime information')).toBeInTheDocument();
  });
});
