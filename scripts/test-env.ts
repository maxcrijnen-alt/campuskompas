import { existsSync, readFileSync } from 'node:fs';
export function loadTestEnv() {
  for (const file of ['.env.local', '.env.test.local'])
    if (existsSync(file))
      for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
        const m = /^([A-Z_]+)=(.*)$/.exec(line);
        if (m) process.env[m[1]] = m[2];
      }
}
