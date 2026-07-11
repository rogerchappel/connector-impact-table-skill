# connector-impact-table-skill

Prepare a deterministic impact table for planned connector actions before an
agent touches external accounts.

## Quickstart

```bash
npm install
npm run build
node dist/cli.js examples/plan.json --format markdown
```

## CLI

```bash
connector-impact-table-skill plan.json --format json
connector-impact-table-skill plan.md --format markdown --out impact.md
connector-impact-table-skill plan.json --fail-on high
```

## What It Reviews

- connector and target
- intended action and side effect
- approval requirement
- rollback note
- dry-run evidence
- conservative risk level

## Safety Notes

The tool is local-only and read-only unless `--out` is supplied. It never calls
Slack, GitHub, CRM, calendar, or project-management APIs. Use it to prepare a
review artifact before collecting approval for live connector actions.

## Limitations

Risk scoring is intentionally conservative and keyword-based. It does not replace
human approval or connector-level permission enforcement.
