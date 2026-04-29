"""Pytest settings module for the attachments test suite.

Extends ``demo.settings`` with test-only apps so the demo project itself
stays free of test scaffolding. Pointed to by ``pytest.ini`` via
``DJANGO_SETTINGS_MODULE``.
"""

from demo.settings import *  # noqa: F401,F403
from demo.settings import INSTALLED_APPS as _DEMO_INSTALLED_APPS

INSTALLED_APPS = [
    *_DEMO_INSTALLED_APPS,
    "nside_wefa.attachments.tests.test_app",
]
