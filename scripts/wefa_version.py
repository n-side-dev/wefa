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

DJANGO_PACKAGE_NAME = "nside-wefa"
BFF_PACKAGE_NAME = "backend-for-frontend"


@dataclass(frozen=True)
class VersionSource:
    path: Path
    reader: Callable[[Path], str]


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
    VersionSource(ROOT / "vue/package.json", read_json_version),
    VersionSource(ROOT / "vue/package-lock.json", read_package_lock_version),
    VersionSource(ROOT / "django/pyproject.toml", read_pyproject_version),
    VersionSource(
        ROOT / "django/uv.lock",
        lambda path: read_uv_lock_package_version(path, DJANGO_PACKAGE_NAME),
    ),
    VersionSource(ROOT / "django/nside_wefa/__init__.py", read_django_init_version),
    VersionSource(ROOT / "bff/pyproject.toml", read_pyproject_version),
    VersionSource(
        ROOT / "bff/uv.lock",
        lambda path: read_uv_lock_package_version(path, BFF_PACKAGE_NAME),
    ),
)


def collect_versions() -> dict[str, str]:
    versions: dict[str, str] = {}
    for source in VERSION_SOURCES:
        try:
            version = source.reader(source.path)
        except Exception as exc:  # pragma: no cover - defensive branch
            raise RuntimeError(f"failed to read version from {relpath(source.path)}: {exc}") from exc
        versions[relpath(source.path)] = version
    return versions


def unified_version(versions: dict[str, str]) -> str | None:
    unique = sorted(set(versions.values()))
    if len(unique) == 1:
        return unique[0]
    return None


def render_versions(versions: dict[str, str]) -> str:
    lines = [f"- {path}: {version}" for path, version in versions.items()]
    return "\n".join(lines)


def ensure_valid_semver(value: str, *, flag_name: str) -> None:
    if not SEMVER_RE.fullmatch(value):
        raise ValueError(
            f"invalid {flag_name} {value!r}; expected strict SemVer (e.g. 1.2.3 or 1.2.3-rc.1)"
        )


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


def post_update_assertions(target_version: str) -> None:
    versions = collect_versions()
    merged = unified_version(versions)
    if merged != target_version:
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
        ensure_valid_semver(args.expect, flag_name="--expect")
        if merged != args.expect:
            print(
                f"Version mismatch: expected {args.expect}, found {merged}",
                file=sys.stderr,
            )
            return 1
    print(f"OK: {merged}")
    return 0


def cmd_set(args: argparse.Namespace) -> int:
    ensure_valid_semver(args.version, flag_name="version")
    current_versions = preflight_for_mutation("set", args.allow_dirty_version_files)
    current = unified_version(current_versions)
    target = args.version

    if args.dry_run:
        print(f"Dry run: would set monorepo version to {target}")
        if current is not None:
            print(f"Current unified version: {current}")
        else:
            print("Current versions are inconsistent:")
            print(render_versions(current_versions))
        print("Files in scope:")
        for path in tracked_version_paths():
            print(f"- {path}")
        return 0

    run_command(["uv", "version", "--project", "django", target, "--no-sync"])
    run_command(["uv", "version", "--project", "bff", target, "--no-sync"])
    run_command(
        [
            "npm",
            "--prefix",
            "vue",
            "version",
            target,
            "--no-git-tag-version",
            "--allow-same-version",
        ]
    )
    update_django_init_version(target)
    post_update_assertions(target)
    print(f"Updated monorepo version to {target}")
    print_change_summary()
    return 0


def cmd_bump(args: argparse.Namespace) -> int:
    versions = preflight_for_mutation("bump", args.allow_dirty_version_files)
    current = unified_version(versions)
    assert current is not None  # validated in preflight

    target = bump_semver(current, args.part)
    if args.dry_run:
        print(f"Dry run: would bump version from {current} to {target}")
        print("Files in scope:")
        for path in tracked_version_paths():
            print(f"- {path}")
        return 0

    run_command(["uv", "version", "--project", "django", target, "--no-sync"])
    run_command(["uv", "version", "--project", "bff", target, "--no-sync"])
    run_command(
        [
            "npm",
            "--prefix",
            "vue",
            "version",
            target,
            "--no-git-tag-version",
            "--allow-same-version",
        ]
    )
    update_django_init_version(target)
    post_update_assertions(target)
    print(f"Bumped monorepo version from {current} to {target}")
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
        help="Assert the unified version matches this SemVer value.",
    )
    parser_check.set_defaults(func=cmd_check)

    parser_set = subparsers.add_parser("set", help="Set the unified monorepo version.")
    parser_set.add_argument("version", help="Target version in strict SemVer format.")
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
