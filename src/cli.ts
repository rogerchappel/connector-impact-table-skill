#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { exceedsFailLevel, inspectPlans, toJson, toMarkdown, type RiskLevel } from './index.js';

function usage(): string {
  return `connector-impact-table-skill <plan...> [--format json|markdown] [--out path] [--fail-on low|medium|high]
`;
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.length === 0) {
  process.stdout.write(usage());
  process.exit(0);
}

let format: 'json' | 'markdown' = 'json';
let out: string | undefined;
let failOn: RiskLevel | undefined;
const paths: string[] = [];
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--format') format = args[++i] as 'json' | 'markdown';
  else if (arg === '--out') out = args[++i];
  else if (arg === '--fail-on') failOn = args[++i] as RiskLevel;
  else paths.push(arg);
}

if (!paths.length) {
  process.stderr.write(usage());
  process.exit(2);
}

const report = await inspectPlans(paths, new Date(0).toISOString());
const rendered = format === 'markdown' ? toMarkdown(report) : toJson(report);
if (out) await writeFile(out, rendered, 'utf8');
else process.stdout.write(rendered);
if (failOn && exceedsFailLevel(report, failOn)) process.exit(1);
