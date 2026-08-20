import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { buildImpactReport } from './impact.js';
import { parsePlanEntries } from './parser.js';

export async function inspectPlans(paths: string[], now = '1970-01-01T00:00:00.000Z') {
  const entries = [];
  for (const path of paths) {
    const text = await readFile(path, 'utf8');
    const source = basename(path);
    const sourceId = source.slice(0, -extname(source).length) || source;
    entries.push(...parsePlanEntries(source, text).map((entry) => ({ ...entry, sourceId })));
  }
  const reserved = new Set(entries.filter((entry) => entry.explicitId).map((entry) => entry.action.id));
  const used = new Set<string>();
  const actions = entries.map(({ action, explicitId, sourceId }) => {
    const base = explicitId ? action.id : `${sourceId}-${action.id}`;
    let id = base;
    let suffix = 2;
    while (used.has(id) || (!explicitId && reserved.has(id))) id = `${base}-${suffix++}`;
    used.add(id);
    return { ...action, id };
  });
  return buildImpactReport(paths.map((path) => basename(path)), actions, now);
}

export { parsePlan, PlanInputError } from './parser.js';
export { scoreAction, buildImpactReport } from './impact.js';
export { toJson, toMarkdown, exceedsFailLevel } from './report.js';
export type { ConnectorAction, ImpactReport, ImpactRow, RiskLevel } from './types.js';
