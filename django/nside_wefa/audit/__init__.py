"""
Public surface of the nside_wefa.audit app.

Consumers import everything they need from this top-level module so they
never have to know about the underlying ``auditlog.*`` API:

    from nside_wefa import audit

    audit.register(Order, include_fields=["status"])     # Path A
    @audit.audited(include_fields=["status"])            # Path B
    class Order(models.Model): ...

    audit.log("order.cancel", actor=request.user, target=order)
    with audit.set_actor(user):
        ...

The convenience constants and exceptions are also re-exported here.
"""

default_app_config = "nside_wefa.audit.apps.AuditConfig"


def __getattr__(name: str):
    # Lazy re-exports so that ``import nside_wefa.audit`` does not pull in
    # auditlog at import time (which would explode before django.setup()).
    if name in {"register", "audited", "AuditAppConfigMixin"}:
        from . import registration

        return getattr(registration, name)
    if name in {"log", "set_actor", "Outcome", "AuditWriteError"}:
        from . import api

        return getattr(api, name)
    if name == "AuditEventImmutableError":
        from . import immutability

        return immutability.AuditEventImmutableError
    raise AttributeError(name)


__all__ = [
    "register",
    "audited",
    "AuditAppConfigMixin",
    "log",
    "set_actor",
    "Outcome",
    "AuditWriteError",
    "AuditEventImmutableError",
]
