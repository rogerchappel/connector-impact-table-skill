import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const testDirectory = new URL('../dist/tests/', import.meta.url);
let testFiles = [];

try {
  testFiles = readdirSync(testDirectory)
    .filter((name) => name.endsWith('.test.js'))
    .sort()
    .map((name) => new URL(name, testDirectory).pathname);
} catch {
  // The diagnostic below covers a missing compiled test directory too.
}

if (testFiles.length === 0) {
  process.stderr.write('Error: no compiled test files discovered in dist/tests\n');
  process.exit(1);
}

process.stdout.write(`Discovered ${testFiles.length} compiled test file(s)\n`);
const result = spawnSync(process.execPath, ['--test', ...testFiles], { stdio: 'inherit' });
process.exit(result.status ?? 1);
