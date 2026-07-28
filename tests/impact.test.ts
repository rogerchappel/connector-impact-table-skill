import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { inspectPlans, parsePlan, scoreAction, toMarkdown } from '../src/index.js';

function runCli(args: string[]) {
  return spawnSync(process.execPath, ['dist/src/cli.js', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
}

test('scores connector actions and reports missing approval', async () => {
  const report = await inspectPlans(['examples/plan.json']);
  assert.equal(report.summary.high, 1);
  assert.equal(report.summary.medium, 1);
  assert.ok(report.warnings.some((warning) => warning.includes('github-label')));
  assert.match(toMarkdown(report), /Connector Impact Table/);
});

test('parses markdown action bullets', () => {
  const actions = parsePlan('sample.txt', '- Send Slack message to #ops');
  assert.equal(actions.length, 1);
  assert.equal(actions[0].connector.toLowerCase(), 'slack');
});

test('rejects invalid, missing, and unknown CLI options with usage errors', () => {
  for (const args of [
    ['examples/plan.json', '--format', 'xml'],
    ['examples/plan.json', '--format'],
    ['examples/plan.json', '--out'],
    ['examples/plan.json', '--fail-on', 'critical'],
    ['examples/plan.json', '--fail-on'],
    ['examples/plan.json', '--unknown']
  ]) {
    const result = runCli(args);
    assert.equal(result.status, 2, `${args.join(' ')}\n${result.stderr}`);
    assert.match(result.stderr, /^Error: .+\nUsage: /);
    assert.equal(result.stdout, '');
  }
});

test('preserves structured markdown action fields', () => {
  const [action] = parsePlan(
    'sample.md',
    '- [slack] action=post; approval=required; rollback=delete; dryRun=payload-reviewed'
  );

  assert.deepEqual(action, {
    id: 'md-1',
    connector: 'slack',
    action: 'post',
    target: 'sample.md',
    sideEffect: 'post',
    approval: 'required',
    rollback: 'delete',
    dryRun: 'payload-reviewed'
  });
  assert.deepEqual(scoreAction(action).missing, []);
  assert.equal(scoreAction(action).risk, 'medium');
});
