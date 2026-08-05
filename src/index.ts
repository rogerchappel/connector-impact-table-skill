import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { buildImpactReport } from './impact.js';
import { parsePlan } from './parser.js';

export async function inspectPlans(paths: string[], now = '1970-01-01T00:00:00.000Z') {
  const actions = [];
  for (const path of paths) {
    const text = await readFile(path, 'utf8');
    actions.push(...parsePlan(basename(path), text));
  }
  return buildImpactReport(paths.map((path) => basename(path)), actions, now);
}

export { parsePlan, PlanInputError } from './parser.js';
export { scoreAction, buildImpactReport } from './impact.js';
export { toJson, toMarkdown, exceedsFailLevel } from './report.js';
export type { ConnectorAction, ImpactReport, ImpactRow, RiskLevel } from './types.js';
