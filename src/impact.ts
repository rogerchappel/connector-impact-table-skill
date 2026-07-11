import type { ConnectorAction, ImpactReport, ImpactRow, RiskLevel } from './types.js';

const HIGH_WORDS = /\b(delete|remove|send|publish|merge|charge|invite|email|dm|message)\b/i;
const MEDIUM_WORDS = /\b(create|update|comment|assign|schedule|label|post)\b/i;

export function scoreAction(action: ConnectorAction): ImpactRow {
  const missing = ['approval', 'rollback', 'dryRun'].filter((key) => {
    const value = action[key as keyof ConnectorAction];
    return !value || value === 'unspecified';
  });
  const text = `${action.action} ${action.sideEffect}`;
  let risk: RiskLevel = HIGH_WORDS.test(text) ? 'high' : MEDIUM_WORDS.test(text) ? 'medium' : 'low';
  if (missing.includes('approval') && risk === 'low') risk = 'medium';
  if (missing.includes('approval') && HIGH_WORDS.test(text)) risk = 'high';
  return { ...action, risk, missing };
}

export function buildImpactReport(sources: string[], actions: ConnectorAction[], now = '1970-01-01T00:00:00.000Z'): ImpactReport {
  const rows = actions.map(scoreAction);
  const summary = { low: 0, medium: 0, high: 0 };
  rows.forEach((row) => { summary[row.risk] += 1; });
  const warnings = rows.filter((row) => row.missing.length).map((row) => `${row.id} missing ${row.missing.join(', ')}`);
  return { sources, generatedAt: now, rows, summary, warnings };
}
