# Connector Impact Table Skill PRD

Status: in-progress
Created: 2026-07-11

## Summary

`connector-impact-table-skill` is a local agent skill and CLI that converts a
planned connector action list into a reviewer-friendly impact table before any
external account write occurs.

## Problem

Agents often prepare connector actions across Slack, GitHub, CRM, project
management, or calendar systems. Reviewers need to see side effects, approval
needs, targets, rollback notes, and dry-run evidence in one deterministic table
before granting permission.

## Target Users

- Agent operators reviewing planned external actions.
- Connector authors documenting safe action boundaries.
- Maintainers adding release-candidate evidence to automation PRs.

## V1 Scope

- Local-first TypeScript CLI with no live connector calls.
- Accept JSON action plans and simple markdown action bullets.
- Normalize targets, side-effect levels, approval requirements, rollback notes,
  dry-run commands, and missing evidence.
- Emit Markdown and JSON reports with conservative risk scoring.
- Fail on high-risk or missing-approval plans when requested.
- Include `SKILL.md`, docs, fixtures, tests, smoke command, and validation.

## Non-Goals

- Executing connector actions.
- Replacing connector permission systems.
- Storing credentials, tokens, or account metadata.
- Live API discovery or hosted dashboards.

## Acceptance Criteria

- `npm test`, `npm run check`, `npm run build`, `npm run smoke`, and
  `bash scripts/validate.sh` pass.
- README documents quickstart, examples, limits, and safety notes.
- `docs/PRD.md`, `docs/TASKS.md`, and `docs/ORCHESTRATION.md` exist.
- Public repo `rogerchappel/connector-impact-table-skill` is created with one
  release-candidate PR.
