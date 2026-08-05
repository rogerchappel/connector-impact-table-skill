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

`--format` accepts `json` or `markdown`; `--fail-on` accepts `low`, `medium`, or
`high`; and `--out` requires a destination path. Missing or unsupported option
values and unknown options print a usage error to stderr and exit with status 2.
JSON input must be an array of actions or an object whose `actions` value is an
array; other `actions` shapes produce the same concise usage-error response.
When valid input meets the `--fail-on` threshold, the report is still rendered
and the command exits with status 1.

Markdown plans may use plain bullets or structured, semicolon-separated fields.
Put the connector in brackets and write each field as `name=value`:

```markdown
- [slack] action=post; target=#ops; sideEffect=send message; approval=required; rollback=delete message; dryRun=payload reviewed
```

Structured bullets support `id`, `connector`, `action`, `target`, `sideEffect`
(also `side-effect` or `side_effect`), `approval`, `rollback`, and `dryRun`
(also `dry-run` or `dry_run`). Values cannot contain semicolons. Omitted review
fields remain `unspecified` so the report continues to flag missing evidence.

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

## Release notes

Before tagging a release, confirm the smoke fixture still represents the intended workflow and summarize any changed output, limitations, or operator steps in the PR.
