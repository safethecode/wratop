import { execFile } from 'node:child_process';

const osascriptPath = '/usr/bin/osascript';
const defaultTimeoutMs = 15_000;

export function executeJxa(
  script: string,
  arguments_: readonly string[],
  timeoutMs = defaultTimeoutMs,
): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      osascriptPath,
      ['-l', 'JavaScript', '-e', script, ...arguments_],
      { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, timeout: timeoutMs },
      (error, stdout, stderr) => {
        if (error !== null) {
          if (error.killed) {
            reject(new Error('Chrome did not respond. Try again.'));
            return;
          }

          const detail = stderr.trim() || error.message;

          if (detail.includes('(-1743)')) {
            reject(
              new Error(
                'Chrome automation permission is required. Allow Wratop in System Settings.',
              ),
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
