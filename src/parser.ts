import type { ConnectorAction } from './types.js';

function normalize(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : 'unspecified';
}

export function parsePlan(source: string, text: string): ConnectorAction[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return parseJsonPlan(trimmed);
  return parseMarkdownPlan(source, text);
}

function parseJsonPlan(text: string): ConnectorAction[] {
  const parsed = JSON.parse(text) as { actions?: unknown[] } | unknown[];
  const actions = Array.isArray(parsed) ? parsed : parsed.actions ?? [];
  return actions.map((item, index) => {
    const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return {
      id: normalize(record.id) === 'unspecified' ? `action-${index + 1}` : normalize(record.id),
      connector: normalize(record.connector),
      action: normalize(record.action),
      target: normalize(record.target),
      sideEffect: normalize(record.sideEffect ?? record.side_effect),
      approval: normalize(record.approval),
      rollback: normalize(record.rollback),
      dryRun: normalize(record.dryRun ?? record.dry_run)
    };
  });
}

function parseMarkdownFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const segment of body.split(';')) {
    const match = segment.trim().match(/^([a-z][a-z_-]*)\s*=\s*(.+)$/i);
    if (!match) continue;
    fields[match[1].toLowerCase().replace(/[-_]/g, '')] = match[2].trim();
  }
  return fields;
}

function parseMarkdownPlan(source: string, text: string): ConnectorAction[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => /^[-*]\s+/.test(line)).map((line, index) => {
    const body = line.replace(/^[-*]\s+/, '');
    const fields = parseMarkdownFields(body.replace(/^\s*\[[^\]]+\]\s*/, ''));
    const connector = body.match(/^\s*\[([^\]]+)\]/)?.[1]?.trim()
      ?? fields.connector
      ?? body.match(new RegExp('\\b(slack|github|calendar|crm|notion|jira|linear)\\b', 'i'))?.[1]
      ?? 'unspecified';
    const action = fields.action ?? body;
    const target = fields.target ?? body.match(/(?:to|in|on)\s+([^.;]+)/i)?.[1]?.trim() ?? source;
    return {
      id: fields.id ?? `md-${index + 1}`,
      connector,
      action,
      target,
      sideEffect: fields.sideeffect ?? action,
      approval: fields.approval ?? 'unspecified',
      rollback: fields.rollback ?? 'unspecified',
      dryRun: fields.dryrun ?? 'unspecified'
    };
  });
}
