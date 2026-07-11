# Orchestration

Run this skill after an agent drafts connector actions and before any external
write is approved.

1. Export or write the planned actions as JSON or markdown bullets.
2. Run `connector-impact-table-skill plan.json --format markdown`.
3. Review high-risk actions, missing approvals, and rollback notes.
4. Approve, revise, or reject the plan outside this tool.

The CLI never calls connector APIs and never performs account writes.
