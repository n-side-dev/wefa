from pathlib import Path
import sys

import yaml

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from bff_app.openapi.generate import build_openapi_document, main


def test_generation_contains_expected_paths(tmp_path: Path) -> None:
    output = tmp_path / "openapi.yaml"

    assert main(["--output", str(output)]) == 0
    document = yaml.safe_load(output.read_text(encoding="utf-8"))
    paths = document["paths"]

    assert "/proxy/api/request/{rest_of_url}" in paths
    assert "/proxy/request/{rest_of_url}" not in paths
    assert "/proxy/api/auth/login" in paths
    assert "/proxy/api/auth/callback" in paths
    assert "/proxy/api/auth/logout" in paths
    assert "/proxy/api/auth/userinfo" in paths
    assert "/proxy/api/auth/session" in paths
    assert "/ping" in paths


def test_decorator_docs_are_exported() -> None:
    document = build_openapi_document()

    assert document["openapi"] == "3.0.3"
    assert document["paths"]["/proxy/api/auth/login"]["get"]["summary"] == "Start login flow"
    assert "sessionCookie" in document["components"]["securitySchemes"]


def test_check_mode_reports_drift(tmp_path: Path) -> None:
    output = tmp_path / "openapi.yaml"

    assert main(["--output", str(output)]) == 0
    assert main(["--check", "--output", str(output)]) == 0

    output.write_text(output.read_text(encoding="utf-8") + "\n# drift\n", encoding="utf-8")

    assert main(["--check", "--output", str(output)]) == 1

