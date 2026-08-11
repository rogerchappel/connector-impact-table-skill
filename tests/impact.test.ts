import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { inspectPlans, parsePlan, PlanInputError, scoreAction, toMarkdown } from '../src/index.js';

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

test('rejects non-array JSON actions without a stack trace or report', () => {
  for (const [shape, actions] of [
    ['object', '{}'],
    ['scalar', '42'],
    ['null', 'null']
  ]) {
    const result = runCli([`tests/fixtures/actions-${shape}.json`]);
    assert.equal(result.status, 2, `${shape}\n${result.stderr}`);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, 'Error: JSON plan "actions" must be an array\n' +
      'Usage: connector-impact-table-skill <plan...> [--format json|markdown] [--out path] [--fail-on low|medium|high]\n');
    assert.doesNotMatch(result.stderr, /(?:\n\s+at |PlanInputError:)/);
  }
});

test('rejects non-object JSON action entries with their zero-based index', () => {
  for (const [plan, index] of [
    ['[null]', 0],
    ['[{}, "send email"]', 1],
    ['[{}, {}, 42]', 2]
  ] as const) {
    assert.throws(
      () => parsePlan('invalid.json', plan),
      (error: unknown) => error instanceof PlanInputError &&
        error.message === `JSON plan action at index ${index} must be an object`
    );
  }
});

test('reports invalid JSON entries and malformed JSON as concise CLI usage errors', () => {
  for (const [fixture, message] of [
    ['actions-invalid-entries.json', 'JSON plan action at index 0 must be an object'],
    ['truncated.json', 'JSON plan is malformed']
  ]) {
    const result = runCli([`tests/fixtures/${fixture}`]);
    assert.equal(result.status, 2, `${fixture}\n${result.stderr}`);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, new RegExp(`^Error: ${message}\\nUsage: `));
    assert.doesNotMatch(result.stderr, /(?:\n\s+at |(?:Syntax|PlanInput)Error:)/);
  }
});

test('preserves valid array and object plans', () => {
  assert.equal(parsePlan('array.json', '[{"action":"send"}]')[0].action, 'send');
  assert.equal(parsePlan('object.json', '{"actions":[{"action":"send"}]}')[0].action, 'send');
});

test('renders valid reports before applying the fail-on exit status', () => {
  const result = runCli(['examples/plan.json', '--fail-on', 'medium']);
  assert.equal(result.status, 1, result.stderr);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /"rows": \[/);
  assert.match(result.stdout, /"risk": "high"/);
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

test('keeps Markdown table fields on a single six-column row', () => {
  const markdown = toMarkdown({
    sources: ['fixture.json'],
    generatedAt: new Date(0).toISOString(),
    rows: [{
      id: 'row|injected\nid',
      connector: 'slack|fake\nconnector',
      action: 'post|message\naction',
      target: '#ops|other\ntarget',
      sideEffect: 'send',
      approval: 'required',
      rollback: 'delete',
      dryRun: 'preview',
      risk: 'high',
      missing: ['approval|rollback\nfield']
    }],
    summary: { low: 0, medium: 0, high: 1 },
    warnings: []
  });

  assert.match(markdown, /\| row\/injected id \| slack\/fake connector \| post\/message action \| #ops\/other target \| high \| approval\/rollback field \|/);
  assert.equal(markdown.split('\n').filter((line) => line.startsWith('| ')).length, 3);
});
