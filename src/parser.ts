import type { ConnectorAction } from './types.js';

export class PlanInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanInputError';
  }
}

function normalize(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : 'unspecified';
}

export function parsePlan(source: string, text: string): ConnectorAction[] {
  return parsePlanEntries(source, text).map(({ action }) => action);
}

export interface ParsedPlanEntry {
  action: ConnectorAction;
  explicitId: boolean;
}

export function parsePlanEntries(source: string, text: string): ParsedPlanEntry[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return parseJsonPlan(trimmed);
  return parseMarkdownPlan(source, text);
}

function parseJsonPlan(text: string): ParsedPlanEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new PlanInputError('JSON plan is malformed');
  }
  let actions: unknown;
  if (Array.isArray(parsed)) actions = parsed;
  else if (parsed !== null && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>;
    if (!Object.hasOwn(record, 'actions')) {
      throw new PlanInputError('JSON plan object must have an "actions" property');
    }
    actions = record.actions;
  }
  else throw new PlanInputError('JSON plan must be an array or an object with an actions array');

  if (!Array.isArray(actions)) {
    throw new PlanInputError('JSON plan "actions" must be an array');
  }
  return actions.map((item, index) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      throw new PlanInputError(`JSON plan action at index ${index} must be an object`);
    }
    const record = item as Record<string, unknown>;
    return { explicitId: normalize(record.id) !== 'unspecified', action: {
      id: normalize(record.id) === 'unspecified' ? `action-${index + 1}` : normalize(record.id),
      connector: normalize(record.connector),
      action: normalize(record.action),
      target: normalize(record.target),
      sideEffect: normalize(record.sideEffect ?? record.side_effect),
      approval: normalize(record.approval),
      rollback: normalize(record.rollback),
      dryRun: normalize(record.dryRun ?? record.dry_run)
    } };
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

function parseMarkdownPlan(source: string, text: string): ParsedPlanEntry[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter((line) => /^[-*]\s+/.test(line)).map((line, index) => {
    const body = line.replace(/^[-*]\s+/, '');
    const fields = parseMarkdownFields(body.replace(/^\s*\[[^\]]+\]\s*/, ''));
    const connector = body.match(/^\s*\[([^\]]+)\]/)?.[1]?.trim()
      ?? fields.connector
      ?? body.match(new RegExp('\\b(slack|github|calendar|crm|notion|jira|linear)\\b', 'i'))?.[1]
      ?? 'unspecified';
    const action = fields.action ?? body;
    const target = fields.target ?? body.match(/(?:to|in|on)\s+([^.;]+)/i)?.[1]?.trim() ?? source;
    return { explicitId: fields.id !== undefined, action: {
      id: fields.id ?? `md-${index + 1}`,
      connector,
      action,
      target,
      sideEffect: fields.sideeffect ?? action,
      approval: fields.approval ?? 'unspecified',
      rollback: fields.rollback ?? 'unspecified',
      dryRun: fields.dryrun ?? 'unspecified'
    } };
  });
}
