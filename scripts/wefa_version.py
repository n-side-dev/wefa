#!/usr/bin/env python3
"""Unified monorepo version orchestrator for vue, django, and bff."""

from __future__ import annotations

import argparse
import json
import re
import shlex
import subprocess
import sys
import tomllib
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

ROOT = Path(__file__).resolve().parent.parent

SEMVER_RE = re.compile(
    r"^(?P<major>0|[1-9]\d*)\."
    r"(?P<minor>0|[1-9]\d*)\."
    r"(?P<patch>0|[1-9]\d*)"
    r"(?:-(?P<prerelease>"
    r"(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)"
    r"(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*"
    r"))?$"
)

PEP440_RE = re.compile(
    r"^(?P<major>0|[1-9]\d*)\."
    r"(?P<minor>0|[1-9]\d*)\."
    r"(?P<patch>0|[1-9]\d*)"
    r"(?:(?P<label>a|b|rc)(?P<number>0|[1-9]\d*))?$"
)

DJANGO_PACKAGE_NAME = "nside-wefa"
BFF_PACKAGE_NAME = "backend-for-frontend"
VERSION_FORMAT_SEMVER = "semver"
VERSION_FORMAT_PEP440 = "pep440"

PRERELEASE_LABEL_TO_PEP440 = {
    "alpha": "a",
    "beta": "b",
    "rc": "rc",
}
PEP440_LABEL_TO_PRERELEASE = {
    "a": "alpha",
    "b": "beta",
    "rc": "rc",
}


@dataclass(frozen=True)
class VersionSource:
    path: Path
    reader: Callable[[Path], str]
    version_format: str


@dataclass(frozen=True)
class VersionTargets:
    semver: str
    python: str


def relpath(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read_json_version(path: Path) -> str:
    data = json.loads(path.read_text(encoding="utf-8"))
    version = data.get("version")
    if not isinstance(version, str):
        raise ValueError("missing top-level version")
    return version


def read_package_lock_version(path: Path) -> str:
    data = json.loads(path.read_text(encoding="utf-8"))
    root_version = data.get("version")
    packages = data.get("packages", {})
    package_root = packages.get("", {}) if isinstance(packages, dict) else {}
    package_version = package_root.get("version")
    if not isinstance(root_version, str):
        raise ValueError("missing top-level version")
    if not isinstance(package_version, str):
        raise ValueError('missing packages[""].version')
    if root_version != package_version:
        raise ValueError(
            f"inconsistent package-lock versions: root={root_version}, packages[\"\"]={package_version}"
        )
    return root_version


def read_pyproject_version(path: Path) -> str:
    data = tomllib.loads(path.read_text(encoding="utf-8"))
    project = data.get("project")
    if not isinstance(project, dict):
        raise ValueError("missing [project] section")
    version = project.get("version")
    if not isinstance(version, str):
        raise ValueError("missing project.version")
    return version


def read_uv_lock_package_version(path: Path, package_name: str) -> str:
    data = tomllib.loads(path.read_text(encoding="utf-8"))
    packages = data.get("package")
    if not isinstance(packages, list):
        raise ValueError("missing package entries")

    matched_versions = [
        pkg.get("version")
        for pkg in packages
        if isinstance(pkg, dict) and pkg.get("name") == package_name
    ]
    matched_versions = [value for value in matched_versions if isinstance(value, str)]
    if len(matched_versions) != 1:
        raise ValueError(f"expected exactly one package named {package_name!r}, found {len(matched_versions)}")
    return matched_versions[0]


def read_django_init_version(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    match = re.search(r'(?m)^__version__\s*=\s*"([^"]+)"\s*$', text)
    if not match:
        raise ValueError("missing __version__ assignment")
    return match.group(1)


VERSION_SOURCES: tuple[VersionSource, ...] = (
    VersionSource(ROOT / "vue/package.json", read_json_version, VERSION_FORMAT_SEMVER),
    VersionSource(ROOT / "vue/package-lock.json", read_package_lock_version, VERSION_FORMAT_SEMVER),
    VersionSource(ROOT / "django/pyproject.toml", read_pyproject_version, VERSION_FORMAT_PEP440),
    VersionSource(
        ROOT / "django/uv.lock",
        lambda path: read_uv_lock_package_version(path, DJANGO_PACKAGE_NAME),
        VERSION_FORMAT_PEP440,
    ),
    VersionSource(ROOT / "django/nside_wefa/__init__.py", read_django_init_version, VERSION_FORMAT_PEP440),
    VersionSource(ROOT / "bff/pyproject.toml", read_pyproject_version, VERSION_FORMAT_PEP440),
    VersionSource(
        ROOT / "bff/uv.lock",
        lambda path: read_uv_lock_package_version(path, BFF_PACKAGE_NAME),
        VERSION_FORMAT_PEP440,
    ),
)

VERSION_SOURCE_BY_PATH = {relpath(source.path): source for source in VERSION_SOURCES}


def collect_versions() -> dict[str, str]:
    versions: dict[str, str] = {}
    for source in VERSION_SOURCES:
        try:
            version = source.reader(source.path)
        except Exception as exc:  # pragma: no cover - defensive branch
            raise RuntimeError(f"failed to read version from {relpath(source.path)}: {exc}") from exc
        versions[relpath(source.path)] = version
    return versions


def ensure_valid_semver(value: str, *, flag_name: str) -> re.Match[str]:
    match = SEMVER_RE.fullmatch(value)
    if not match:
        raise ValueError(
            f"invalid {flag_name} {value!r}; expected strict SemVer (e.g. 1.2.3 or 1.2.3-rc.1)"
        )
    return match


def canonicalize_semver(value: str, *, flag_name: str) -> str:
    match = ensure_valid_semver(value, flag_name=flag_name)
    base = f"{match.group('major')}.{match.group('minor')}.{match.group('patch')}"
    prerelease = match.group("prerelease")
    if prerelease is None:
        return base
    return f"{base}-{prerelease}"


def semver_to_python_version(value: str, *, flag_name: str) -> str:
    match = ensure_valid_semver(value, flag_name=flag_name)
    base = f"{match.group('major')}.{match.group('minor')}.{match.group('patch')}"
    prerelease = match.group("prerelease")
    if prerelease is None:
        return base

    parts = prerelease.split(".")
    if len(parts) != 2 or not parts[1].isdigit():
        raise ValueError(
            f"invalid {flag_name} {value!r}; prerelease must be <alpha|beta|rc>.<number> "
            "to stay compatible with Python package metadata"
        )

    label = parts[0].lower()
    number = parts[1]
    pep440_label = PRERELEASE_LABEL_TO_PEP440.get(label)
    if pep440_label is None:
        raise ValueError(
            f"invalid {flag_name} {value!r}; prerelease label must be one of "
            f"{', '.join(sorted(PRERELEASE_LABEL_TO_PEP440))}"
        )
    return f"{base}{pep440_label}{number}"


def pep440_to_semver(value: str, *, flag_name: str) -> str:
    match = PEP440_RE.fullmatch(value)
    if not match:
        raise ValueError(
            f"invalid {flag_name} {value!r}; expected PEP 440 core version (e.g. 1.2.3rc1)"
        )

    base = f"{match.group('major')}.{match.group('minor')}.{match.group('patch')}"
    label = match.group("label")
    number = match.group("number")
    if label is None:
        return base
    semver_label = PEP440_LABEL_TO_PRERELEASE[label]
    return f"{base}-{semver_label}.{number}"


def normalize_recorded_version(path: str, value: str) -> str:
    try:
        return canonicalize_semver(value, flag_name=f"version in {path}")
    except ValueError:
        pass
    try:
        return pep440_to_semver(value, flag_name=f"version in {path}")
    except ValueError as exc:
        raise ValueError(
            f"unsupported version format in {path}: {value!r}; expected strict SemVer or "
            "PEP 440 prerelease form (a/b/rc)"
        ) from exc


def unified_version(versions: dict[str, str]) -> str | None:
    normalized = {path: normalize_recorded_version(path, value) for path, value in versions.items()}
    unique = sorted(set(normalized.values()))
    if len(unique) == 1:
        return unique[0]
    return None


def render_versions(versions: dict[str, str]) -> str:
    lines = [f"- {path}: {version}" for path, version in versions.items()]
    return "\n".join(lines)


def build_version_targets(value: str, *, flag_name: str) -> VersionTargets:
    semver = canonicalize_semver(value, flag_name=flag_name)
    python = semver_to_python_version(value, flag_name=flag_name)
    return VersionTargets(semver=semver, python=python)


def bump_semver(version: str, part: str) -> str:
    match = SEMVER_RE.fullmatch(version)
    if not match:
        raise ValueError(f"cannot bump non-SemVer version {version!r}")
    major = int(match.group("major"))
    minor = int(match.group("minor"))
    patch = int(match.group("patch"))
    if part == "major":
        return f"{major + 1}.0.0"
    if part == "minor":
        return f"{major}.{minor + 1}.0"
    if part == "patch":
        return f"{major}.{minor}.{patch + 1}"
    raise ValueError(f"unknown bump part {part!r}")


def tracked_version_paths() -> list[str]:
    return [relpath(source.path) for source in VERSION_SOURCES]


def git_dirty_version_files() -> list[str]:
    command = ["git", "status", "--porcelain", "--", *tracked_version_paths()]
    result = subprocess.run(
        command,
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"failed to inspect git status: {result.stderr.strip()}")

    dirty: list[str] = []
    for line in result.stdout.splitlines():
        entry = line[3:]
        if " -> " in entry:
            entry = entry.split(" -> ", 1)[1]
        dirty.append(entry)
    return sorted(set(dirty))


def ensure_dirty_preflight_allowed(allow_dirty: bool) -> None:
    dirty_files = git_dirty_version_files()
    if not dirty_files or allow_dirty:
        return
    formatted = "\n".join(f"- {path}" for path in dirty_files)
    raise RuntimeError(
        "refusing to run with modified version files:\n"
        f"{formatted}\n"
        "commit/revert those changes first, or use --allow-dirty-version-files"
    )


def run_command(command: list[str]) -> None:
    print(f"+ {' '.join(shlex.quote(part) for part in command)}")
    subprocess.run(command, cwd=ROOT, check=True)


def expected_version_for_path(path: str, targets: VersionTargets) -> str:
    source = VERSION_SOURCE_BY_PATH.get(path)
    if source is None:
        raise RuntimeError(f"unknown version source path {path!r}")
    if source.version_format == VERSION_FORMAT_SEMVER:
        return targets.semver
    if source.version_format == VERSION_FORMAT_PEP440:
        return targets.python
    raise RuntimeError(f"unsupported version format {source.version_format!r} for {path}")


def snapshot_version_file_contents() -> dict[Path, str]:
    return {source.path: source.path.read_text(encoding="utf-8") for source in VERSION_SOURCES}


def restore_version_file_contents(snapshot: dict[Path, str]) -> None:
    for path, content in snapshot.items():
        path.write_text(content, encoding="utf-8")


def run_transactional_version_update(action: Callable[[], None]) -> None:
    snapshot = snapshot_version_file_contents()
    try:
        action()
    except Exception as exc:
        try:
            restore_version_file_contents(snapshot)
        except Exception as rollback_exc:  # pragma: no cover - defensive branch
            raise RuntimeError(
                "version update failed and rollback could not restore tracked version files"
            ) from rollback_exc
        raise RuntimeError(f"version update failed; restored tracked version files ({exc})") from exc


def update_django_init_version(target_version: str) -> None:
    path = ROOT / "django/nside_wefa/__init__.py"
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(r'(?m)^__version__\s*=\s*"([^"]+)"\s*$')
    match = pattern.search(text)
    if not match:
        raise RuntimeError(f"unable to locate __version__ in {relpath(path)}")
    if match.group(1) == target_version:
        return
    updated, replacements = pattern.subn(f'__version__ = "{target_version}"', text, count=1)
    if replacements != 1:
        raise RuntimeError(f"unable to update __version__ in {relpath(path)}")
    path.write_text(updated, encoding="utf-8")


def post_update_assertions(targets: VersionTargets) -> None:
    versions = collect_versions()
    mismatches: list[str] = []
    for path, actual in versions.items():
        expected = expected_version_for_path(path, targets)
        if actual != expected:
            mismatches.append(f"- {path}: expected {expected}, found {actual}")
    if mismatches:
        formatted = "\n".join(mismatches)
        raise RuntimeError(
            "post-update validation failed; files do not match expected serialized versions:\n"
            f"{formatted}"
        )

    merged = unified_version(versions)
    if merged != targets.semver:
        raise RuntimeError(
            "post-update validation failed; files are not aligned:\n"
            f"{render_versions(versions)}"
        )


def print_change_summary() -> None:
    dirty_files = git_dirty_version_files()
    if not dirty_files:
        print("No version files changed.")
        return
    print("Changed version files:")
    for path in dirty_files:
        print(f"- {path}")


def preflight_for_mutation(command_name: str, allow_dirty: bool) -> dict[str, str]:
    versions = collect_versions()
    if command_name == "bump" and unified_version(versions) is None:
        raise RuntimeError(
            "cannot bump because version sources are inconsistent:\n"
            f"{render_versions(versions)}\n"
            "run `set <version>` first to realign all projects"
        )
    ensure_dirty_preflight_allowed(allow_dirty)
    return versions


def cmd_show(_: argparse.Namespace) -> int:
    versions = collect_versions()
    merged = unified_version(versions)
    if merged is None:
        print("Version mismatch detected:", file=sys.stderr)
        print(render_versions(versions), file=sys.stderr)
        return 1
    print(merged)
    return 0


def cmd_check(args: argparse.Namespace) -> int:
    versions = collect_versions()
    merged = unified_version(versions)
    if merged is None:
        print("Version mismatch detected:", file=sys.stderr)
        print(render_versions(versions), file=sys.stderr)
        return 1

    if args.expect:
        expected = build_version_targets(args.expect, flag_name="--expect")
        if merged != expected.semver:
            print(
                f"Version mismatch: expected {expected.semver}, found {merged}",
                file=sys.stderr,
            )
            return 1
    print(f"OK: {merged}")
    return 0


def cmd_set(args: argparse.Namespace) -> int:
    targets = build_version_targets(args.version, flag_name="version")
    current_versions = preflight_for_mutation("set", args.allow_dirty_version_files)
    current = unified_version(current_versions)

    if args.dry_run:
        print(f"Dry run: would set monorepo version to {targets.semver}")
        if targets.python != targets.semver:
            print(f"Python projects will use normalized PEP 440 value: {targets.python}")
        if current is not None:
            print(f"Current unified version: {current}")
        else:
            print("Current versions are inconsistent:")
            print(render_versions(current_versions))
        print("Files in scope:")
        for path in tracked_version_paths():
            print(f"- {path}")
        return 0

    def mutate() -> None:
        run_command(["uv", "version", "--project", "django", targets.python, "--no-sync"])
        run_command(["uv", "version", "--project", "bff", targets.python, "--no-sync"])
        run_command(
            [
                "npm",
                "--prefix",
                "vue",
                "version",
                targets.semver,
                "--no-git-tag-version",
                "--allow-same-version",
            ]
        )
        update_django_init_version(targets.python)
        post_update_assertions(targets)

    run_transactional_version_update(mutate)
    print(f"Updated monorepo version to {targets.semver}")
    print_change_summary()
    return 0


def cmd_bump(args: argparse.Namespace) -> int:
    versions = preflight_for_mutation("bump", args.allow_dirty_version_files)
    current = unified_version(versions)
    assert current is not None  # validated in preflight

    target = bump_semver(current, args.part)
    targets = build_version_targets(target, flag_name="bumped version")
    if args.dry_run:
        print(f"Dry run: would bump version from {current} to {targets.semver}")
        if targets.python != targets.semver:
            print(f"Python projects will use normalized PEP 440 value: {targets.python}")
        print("Files in scope:")
        for path in tracked_version_paths():
            print(f"- {path}")
        return 0

    def mutate() -> None:
        run_command(["uv", "version", "--project", "django", targets.python, "--no-sync"])
        run_command(["uv", "version", "--project", "bff", targets.python, "--no-sync"])
        run_command(
            [
                "npm",
                "--prefix",
                "vue",
                "version",
                targets.semver,
                "--no-git-tag-version",
                "--allow-same-version",
            ]
        )
        update_django_init_version(targets.python)
        post_update_assertions(targets)

    run_transactional_version_update(mutate)
    print(f"Bumped monorepo version from {current} to {targets.semver}")
    print_change_summary()
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Manage the shared monorepo version across vue, django, and bff."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    parser_show = subparsers.add_parser("show", help="Show the unified monorepo version.")
    parser_show.set_defaults(func=cmd_show)

    parser_check = subparsers.add_parser("check", help="Check that all project versions are aligned.")
    parser_check.add_argument(
        "--expect",
        help="Assert the unified version matches this SemVer value (prerelease: alpha|beta|rc.<N>).",
    )
    parser_check.set_defaults(func=cmd_check)

    parser_set = subparsers.add_parser("set", help="Set the unified monorepo version.")
    parser_set.add_argument(
        "version",
        help="Target SemVer version (prerelease must be alpha|beta|rc.<N> for Python compatibility).",
    )
    parser_set.add_argument("--dry-run", action="store_true", help="Preview changes without writing files.")
    parser_set.add_argument(
        "--allow-dirty-version-files",
        action="store_true",
        help="Allow running when tracked version files are already modified.",
    )
    parser_set.set_defaults(func=cmd_set)

    parser_bump = subparsers.add_parser("bump", help="Bump the unified monorepo version.")
    parser_bump.add_argument("part", choices=["major", "minor", "patch"], help="Version segment to bump.")
    parser_bump.add_argument("--dry-run", action="store_true", help="Preview changes without writing files.")
    parser_bump.add_argument(
        "--allow-dirty-version-files",
        action="store_true",
        help="Allow running when tracked version files are already modified.",
    )
    parser_bump.set_defaults(func=cmd_bump)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    except RuntimeError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    except subprocess.CalledProcessError as exc:
        command = " ".join(shlex.quote(part) for part in exc.cmd)
        print(f"error: command failed ({exc.returncode}): {command}", file=sys.stderr)
        return exc.returncode or 1


if __name__ == "__main__":
    raise SystemExit(main())
