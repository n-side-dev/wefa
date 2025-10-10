"""
Sphinx configuration for building the nside_wefa documentation.

This file sets up Python and Django paths so that autodoc can import the
project modules and generate API documentation. It is used by the docs build
locally and in CI.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime
from pathlib import Path

# -- Path setup --------------------------------------------------------------
# Add the project root (the "django" folder that contains the nside_wefa package)
# so that Sphinx can import the library during autodoc.
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

# -- Project information -----------------------------------------------------
project = "N-SIDE WeFa"
organization = "N-SIDE"
current_year = datetime.now().year
copyright = f"{current_year}, {organization}"

# -- Django setup ------------------------------------------------------------
# Ensure Django is configured so importing Django models/apps works in autodoc.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "demo.settings")
try:
    import django  # type: ignore

    django.setup()
except Exception as exc:  # pragma: no cover - docs build environment only
    # Don't fail import-time; Sphinx will still build non-autodoc pages.
    # The CI sets DJANGO_SETTINGS_MODULE and has Django installed.
    print(f"[sphinx conf] Warning: Django setup failed: {exc}")

# -- General configuration ---------------------------------------------------
extensions = [
    "sphinx.ext.autodoc",
    "sphinx.ext.autosummary",
    "sphinx.ext.napoleon",
    "sphinx.ext.viewcode",
]

# Automatically generate stub pages for autosummary directives
autosummary_generate = True

# Napoleon settings for Google/NumPy style docstrings
napoleon_google_docstring = True
napoleon_numpy_docstring = True

# If true, the current module name will be prepended to all object names
add_module_names = False

# The master toctree document.
master_doc = "index"

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]

# -- Options for HTML output -------------------------------------------------
html_theme = "alabaster"
html_static_path = ["_static"]
