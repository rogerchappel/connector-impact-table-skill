import type { ImpactReport, RiskLevel } from './types.js';

export function toJson(report: ImpactReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function markdownCell(value: string): string {
  return value.replace(/\|/g, '/').replace(/\r?\n|\r/g, ' ');
}

export function toMarkdown(report: ImpactReport): string {
  const lines = ['# Connector Impact Table', '', `Sources: ${report.sources.join(', ')}`, `Risk: low ${report.summary.low}, medium ${report.summary.medium}, high ${report.summary.high}`, ''];
  if (report.warnings.length) lines.push('## Warnings', '', ...report.warnings.map((warning) => `- ${warning}`), '');
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
