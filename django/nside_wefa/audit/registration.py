"""
Registration helpers for the audit app.

Three opt-in paths, all of which delegate to :func:`auditlog.registry.auditlog.register`:

- **Path A** — module-level :func:`register` at the bottom of ``models.py``.
- **Path B** — :func:`audited` decorator over the model class.
- **Path C** — :class:`AuditAppConfigMixin` declaring ``audited_models`` on the
  consuming app's ``AppConfig``. The mixin's ``ready()`` walks the dict and
  calls :func:`register` once per entry, after our app has finished its own
  ``ready()`` so that translated settings are in effect.

The settings-only Path D (``NSIDE_WEFA.AUDIT.MODELS``) is wired by the
settings translation layer in :mod:`nside_wefa.audit.settings_translation`
and django-auditlog's ``register_from_settings``.
"""

import logging
from typing import Any, Dict, Set, Type

from django.db import models

logger = logging.getLogger("nside_wefa.audit")

# Set of model classes registered through one of the WeFa entry points.
# Exposed for tests; not part of the public contract.
_wefa_registered: Set[Type[models.Model]] = set()


def register(model: Type[models.Model], **kwargs: Any) -> Type[models.Model]:
    """Register a model for auditing.

    Thin wrapper around :func:`auditlog.registry.auditlog.register` that
    tracks the registration in a private set so tests and admin views can
    inspect what WeFa has wired up. ``kwargs`` are forwarded as-is; see the
    auditlog docs for the full signature.

    The model is returned unchanged so the call site can chain with the
    decorator form (Path B).
    """
    from auditlog.registry import auditlog as _registry

    _registry.register(model, **kwargs)
    _wefa_registered.add(model)
    return model


def audited(**kwargs: Any):
    """Class decorator equivalent to calling :func:`register` on the class.

    Example::

        @audited(include_fields=["status", "total"])
        class Order(models.Model):
            ...
    """

    def _decorator(cls: Type[models.Model]) -> Type[models.Model]:
        register(cls, **kwargs)
        return cls

    return _decorator


class AuditAppConfigMixin:
    """Mixin for consumer ``AppConfig`` classes that declare audited models.

    Example::

        class ConsumerAppConfig(AuditAppConfigMixin, AppConfig):
            name = "consumer_app"
            audited_models = {
                "Order":    {"include_fields": ["status", "total"]},
                "Customer": {"exclude_fields": ["last_login_ip"]},
            }

    The mixin's ``ready()`` resolves each model via ``self.get_model(name)``
    and calls :func:`register` for each. The cooperative ``super().ready()``
    call means the mixin composes with other mixins on the same AppConfig.

    Models that fail to resolve are skipped with a warning so a typo in one
    entry does not block the rest of the app from booting.
    """

    audited_models: Dict[str, Dict[str, Any]] = {}

    def ready(self) -> None:  # type: ignore[override]
        # Cooperative super() call so the mixin composes with other mixins on
        # the same AppConfig. Tolerate the case where ``super()`` resolves to
        # ``object`` (no ``ready`` method), which happens when the mixin is
        # invoked outside a real AppConfig context — primarily in tests.
        parent_ready = getattr(super(), "ready", None)
        if callable(parent_ready):
            parent_ready()
        for model_name, options in self.audited_models.items():
            try:
                model = self.get_model(model_name)  # type: ignore[attr-defined]
            except LookupError:
                logger.warning(
                    "AuditAppConfigMixin: could not resolve %s.%s, skipping.",
                    getattr(self, "label", "?"),
                    model_name,
                )
                continue
            register(model, **(options or {}))
