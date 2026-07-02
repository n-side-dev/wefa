# WeFa Review Checklist

Use this checklist when the task is a review rather than an implementation.

## Output Shape

- Findings first, ordered by severity, with file references.
- Keep summaries brief and secondary to the findings.
- If there are no findings, say so explicitly and call out any residual risk or missing verification.

## Review Priorities

1. Correctness issues, behavioural regressions, broken contracts, and risky edge cases.
2. Missing tests, especially for non-default or opt-in paths.
3. API, documentation, release, or versioning impacts that were not updated alongside the change.
4. Auth, cookie, session, and security-sensitive concerns.
5. Maintainability issues that materially raise future change risk.

## WeFa-Specific Prompts

- Check that generated artifacts and documented contracts stay in sync.
- Call out missing workspace quality-gate coverage when the change crosses `django/`, `bff/`, or `vue/`.
- For Vue work, treat untranslated user-facing text as a review issue.
