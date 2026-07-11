import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectPlans, parsePlan, toMarkdown } from '../src/index.js';

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
