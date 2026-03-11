import argparse
import importlib.util
import sys
import tempfile
from pathlib import Path
from unittest import TestCase, mock


MODULE_PATH = Path(__file__).with_name("wefa_version.py")
SPEC = importlib.util.spec_from_file_location("wefa_version_module", MODULE_PATH)
assert SPEC and SPEC.loader
wefa_version = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = wefa_version
SPEC.loader.exec_module(wefa_version)


MIXED_RC_VERSIONS = {
    "vue/package.json": "1.0.0-rc.1",
    "vue/package-lock.json": "1.0.0-rc.1",
    "django/pyproject.toml": "1.0.0rc1",
    "django/uv.lock": "1.0.0rc1",
    "django/nside_wefa/__init__.py": "1.0.0rc1",
    "bff/pyproject.toml": "1.0.0rc1",
    "bff/uv.lock": "1.0.0rc1",
}


class WefaVersionTests(TestCase):
    def test_semver_to_pep440_conversion(self) -> None:
        self.assertEqual(
            wefa_version.semver_to_python_version("1.2.3-rc.4", flag_name="version"),
            "1.2.3rc4",
        )
        self.assertEqual(
            wefa_version.semver_to_python_version("1.2.3-alpha.2", flag_name="version"),
            "1.2.3a2",
        )
        self.assertEqual(
            wefa_version.semver_to_python_version("1.2.3-beta.7", flag_name="version"),
            "1.2.3b7",
        )

    def test_pep440_to_semver_conversion(self) -> None:
        self.assertEqual(
            wefa_version.pep440_to_semver("1.2.3rc4", flag_name="version"),
            "1.2.3-rc.4",
        )
        self.assertEqual(
            wefa_version.pep440_to_semver("1.2.3a2", flag_name="version"),
            "1.2.3-alpha.2",
        )
        self.assertEqual(
            wefa_version.pep440_to_semver("1.2.3b7", flag_name="version"),
            "1.2.3-beta.7",
        )

    def test_rejects_unsupported_semver_prerelease_label(self) -> None:
        with self.assertRaisesRegex(ValueError, "prerelease label must be one of"):
            wefa_version.build_version_targets("1.2.3-preview.1", flag_name="version")

    def test_unified_version_accepts_mixed_semver_and_pep440(self) -> None:
        self.assertEqual(wefa_version.unified_version(MIXED_RC_VERSIONS), "1.0.0-rc.1")

    def test_check_expect_semver_matches_pep440_python_sources(self) -> None:
        args = argparse.Namespace(expect="1.0.0-rc.1")
        with mock.patch.object(wefa_version, "collect_versions", return_value=MIXED_RC_VERSIONS):
            self.assertEqual(wefa_version.cmd_check(args), 0)

    def test_post_update_assertions_require_expected_serialization(self) -> None:
        targets = wefa_version.build_version_targets("1.0.0-rc.1", flag_name="version")

        with mock.patch.object(wefa_version, "collect_versions", return_value=MIXED_RC_VERSIONS):
            wefa_version.post_update_assertions(targets)

        wrong_versions = dict(MIXED_RC_VERSIONS)
        wrong_versions["django/pyproject.toml"] = "1.0.0-rc.1"
        with mock.patch.object(wefa_version, "collect_versions", return_value=wrong_versions):
            with self.assertRaisesRegex(RuntimeError, "expected 1.0.0rc1"):
                wefa_version.post_update_assertions(targets)

    def test_transactional_update_restores_files_on_failure(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            path = Path(tmpdir) / "version.txt"
            path.write_text("before\n", encoding="utf-8")
            source = wefa_version.VersionSource(
                path=path,
                reader=lambda p: p.read_text(encoding="utf-8").strip(),
                version_format=wefa_version.VERSION_FORMAT_SEMVER,
            )

            def mutate() -> None:
                path.write_text("after\n", encoding="utf-8")
                raise RuntimeError("boom")

            with mock.patch.object(wefa_version, "VERSION_SOURCES", (source,)):
                with self.assertRaisesRegex(RuntimeError, "restored tracked version files"):
                    wefa_version.run_transactional_version_update(mutate)

            self.assertEqual(path.read_text(encoding="utf-8"), "before\n")
