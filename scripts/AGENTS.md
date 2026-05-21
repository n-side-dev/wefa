# WeFa Scripts - Agent Guide

## Scope

This file applies to repository automation under `scripts/`, including the shared version orchestrator.

Read the root `README.md` release/versioning section before changing version automation or release-facing behavior.

## Versioning Rules

- The monorepo uses one shared version across `django/`, `vue/`, and `bff/`.
- `scripts/wefa_version.py` is the owner for version reads, checks, bumps, and explicit sets.
- Do not manually edit per-package version fields in `django/pyproject.toml`, `vue/package.json`, `vue/package-lock.json`, or `bff/pyproject.toml` unless the task is to repair the orchestrator or generated version state.
- Prefer `python3 scripts/wefa_version.py <command> --dry-run` before commands that mutate version files.
- Preserve SemVer input rules and PEP 440 normalization for Python project files.
- Keep prerelease support limited to the identifiers documented in the root README unless the release policy changes.

## Implementation Rules

- Keep automation deterministic, non-interactive by default, and safe to run from CI.
- Use explicit errors for inconsistent version state instead of silently normalizing unexpected values.
- Update root README release/versioning docs when command behavior or supported version formats change.
- Avoid adding dependencies for simple automation; if a dependency is necessary, document why.

## Validation Commands

Run from the repository root:

```bash
python3 -m unittest discover -s scripts -p 'test_*.py'
python3 scripts/wefa_version.py show
python3 scripts/wefa_version.py check --expect "$(python3 scripts/wefa_version.py show)"
```

For mutating version command changes, also run representative `--dry-run` bump and set commands before any real mutation.
