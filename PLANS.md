# WeFa Cross-Workspace Plan Template

Use this template for ambiguous, long-running, or cross-workspace work before implementation starts.

## Goal

State the user-visible outcome and the success condition.

## Touched Workspaces

- `django/`
- `bff/`
- `vue/`

List only the workspaces that the change will touch and explain why.

## Constraints

- Architecture or ownership boundaries to preserve
- Existing contracts that must remain compatible
- Documentation or generated artifacts that must stay in sync

## Implementation Notes

- Main behavior changes
- Public API or contract changes
- Required docs or generated-file updates

## Verification

- Exact commands to run in each touched workspace
- Any cross-workspace checks needed for contracts, generated clients, or browser flows

## Rollback / Compatibility

- Backward-compatibility concerns
- Migration or deploy notes
- Safe rollback approach if the change needs to be reverted
