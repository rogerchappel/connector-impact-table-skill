import type { ImpactReport, RiskLevel } from './types.js';

export function toSarif(report: ImpactReport): string {
  const rules = [...new Set(report.rows.map((row) => row.id))].map((id) => ({
    id,
    shortDescription: { text: `Connector impact: ${id}` },
  }));
  const results = report.rows.map((row) => ({
    ruleId: row.id,
    level: row.risk === 'high' ? 'error' : row.risk === 'medium' ? 'warning' : 'note',
    message: { text: `${row.connector} ${row.action} on ${row.target}; missing: ${row.missing.join(', ') || 'none'}` },
  }));
  return `${JSON.stringify({
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [{ tool: { driver: { name: 'connector-impact-table-skill', rules } }, results }],
  }, null, 2)}\n`;
}

export function toJson(report: ImpactReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function markdownText(value: string): string {
  return value
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/([\\`*_{}\[\]()<>#+.!|\-])/g, '\\$1');
}

function markdownCell(value: string): string {
  return markdownText(value);
}

export function toMarkdown(report: ImpactReport): string {
  const lines = ['# Connector Impact Table', '', `Sources: ${report.sources.map(markdownText).join(', ')}`, `Risk: low ${report.summary.low}, medium ${report.summary.medium}, high ${report.summary.high}`, ''];
  if (report.warnings.length) lines.push('## Warnings', '', ...report.warnings.map((warning) => `- ${markdownText(warning)}`), '');
  lines.push('| ID | Connector | Action | Target | Risk | Missing |', '| --- | --- | --- | --- | --- | --- |');
  for (const row of report.rows) {
    const cells = [row.id, row.connector, row.action, row.target, row.risk, row.missing.join(', ') || 'none'];
    lines.push(`| ${cells.map(markdownCell).join(' | ')} |`);
  }
  return `${lines.join('\n')}\n`;
}

export function exceedsFailLevel(report: ImpactReport, failOn: RiskLevel): boolean {
  const order: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 };
  return report.rows.some((row) => order[row.risk] >= order[failOn]);
}
