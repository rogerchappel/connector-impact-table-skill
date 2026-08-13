#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { exceedsFailLevel, inspectPlans, PlanInputError, toJson, toMarkdown, type RiskLevel } from './index.js';

function usage(): string {
  return `Usage: connector-impact-table-skill <plan...> [--format json|markdown] [--out path] [--fail-on low|medium|high]
`;
}

const args = process.argv.slice(2);
if ((args.length === 1 && args[0] === '--help') || args.length === 0) {
  process.stdout.write(usage());
  process.exit(0);
}

let format: 'json' | 'markdown' = 'json';
let out: string | undefined;
let failOn: RiskLevel | undefined;
const paths: string[] = [];
const failLevels: RiskLevel[] = ['low', 'medium', 'high'];

function optionValue(option: string, index: number): string {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    process.stderr.write(`Error: ${option} requires a value\n${usage()}`);
    process.exit(2);
  }
  return value;
}

function usageError(message: string): never {
  process.stderr.write(`Error: ${message}\n${usage()}`);
  process.exit(2);
}

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--format') {
    const value = optionValue(arg, i++);
    if (value !== 'json' && value !== 'markdown') usageError(`invalid --format value: ${value}`);
    format = value;
  } else if (arg === '--out') {
    out = optionValue(arg, i++);
  } else if (arg === '--fail-on') {
    const value = optionValue(arg, i++);
    if (!failLevels.includes(value as RiskLevel)) usageError(`invalid --fail-on value: ${value}`);
    failOn = value as RiskLevel;
  } else if (arg.startsWith('-')) usageError(`unknown option: ${arg}`);
  else paths.push(arg);
}

if (!paths.length) usageError('at least one plan path is required');
if (out && paths.some((path) => resolve(path) === resolve(out))) {
  usageError('--out must not resolve to an input plan path');
}

try {
  const report = await inspectPlans(paths, new Date(0).toISOString());
  const rendered = format === 'markdown' ? toMarkdown(report) : toJson(report);
  if (out) await writeFile(out, rendered, 'utf8');
  else process.stdout.write(rendered);
  if (failOn && exceedsFailLevel(report, failOn)) process.exit(1);
} catch (error) {
  if (error instanceof PlanInputError) usageError(error.message);
  throw error;
}
