# Connector Impact Table Skill

Use this skill when an agent has prepared actions for Slack, GitHub, CRM,
calendar, project-management, or similar connectors and a human needs a clear
impact table before external side effects occur.

## Inputs

- JSON action plan with `actions` entries, or markdown bullets describing planned
  actions.
- Optional `--fail-on high` or `--fail-on medium` for CI-style review gates.

## Side-Effect Boundaries

- Reads only local plan files passed on the command line.
- Writes only when `--out <path>` is provided.
- Does not call connector APIs, mutate external accounts, or store credentials.

## Approval Requirements

Use the report to collect explicit approval for any action marked `medium` or
`high`, and for any action with missing rollback notes or dry-run evidence.

## Validation

Run `npm test`, `npm run smoke`, and inspect the Markdown table before allowing
an agent to continue with live connector actions.
