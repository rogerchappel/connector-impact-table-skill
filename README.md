# connector-impact-table-skill

Prepare a deterministic impact table for planned connector actions before an
agent touches external accounts.

## Quickstart

```bash
npm install
npm run release:check
node dist/src/cli.js examples/plan.json --format markdown
```

`npm run release:check` runs type checks, builds the CLI, executes the compiled test suite, runs the fixture-backed CLI smoke, and verifies npm pack contents.

## Verification

Run the same checks used for release-readiness before publishing or opening a release PR:

```bash
npm run check
npm test
npm run build
npm run smoke
npm run release:check
npm pack --dry-run
```

## CLI

```bash
connector-impact-table-skill plan.json --format json
connector-impact-table-skill plan.md --format markdown --out impact.md
connector-impact-table-skill plan.json --fail-on high
```

## Package Contents

The npm package ships compiled CLI/source files, docs, examples, changelog, license, and the skill entrypoint. `npm run package:smoke` checks those contents after a build so the published package keeps the documented quickstart runnable.

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
