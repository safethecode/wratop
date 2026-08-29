import { execFile } from 'node:child_process';

const osascriptPath = '/usr/bin/osascript';

export function executeJxa(script: string, arguments_: readonly string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      osascriptPath,
      ['-l', 'JavaScript', '-e', script, ...arguments_],
      { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error !== null) {
          const detail = stderr.trim() || error.message;

          if (detail.includes('(-1743)')) {
            reject(
              new Error('Chrome 자동화 권한이 필요합니다. 시스템 설정에서 wratop을 허용해 주세요.'),
            );
            return;
          }

          reject(new Error(detail));
          return;
        }

        resolve(stdout.trim());
      },
    );
  });
}
