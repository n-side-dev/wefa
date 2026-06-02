"""Public URL helper for attachment subclasses.

Consumers call :func:`register_attachment_endpoints` from their app's
``urls.py`` to wire a generic CRUD surface over a concrete
:class:`Attachment` subclass.
"""

from __future__ import annotations

from typing import Any, Callable, Iterable, Optional, Type

from django.urls import path
from rest_framework.permissions import BasePermission

from .models import Attachment
from .views import build_views


def _normalise_prefix(prefix: str) -> str:
    """Strip leading and trailing slashes for predictable concatenation."""
    return prefix.strip("/")


def register_attachment_endpoints(
    model_class: Type[Attachment],
    *,
    prefix: str,
    permissions: Iterable[Type[BasePermission]] = (),
    queryset: Optional[Callable[..., Any]] = None,
    on_create: Optional[Callable[..., None]] = None,
    serializer_class=None,
    singleton: bool = False,
) -> list:
    """Return URL patterns implementing the attachment CRUD surface.

    :param model_class: A concrete subclass of :class:`Attachment`.
    :param prefix: URL prefix relative to the app's ``include()``. May
        contain Django URL converters (e.g.
        ``"contracts/<int:contract_id>/attachment"``).
    :param permissions: DRF permission classes applied to every view.
    :param queryset: Optional callable that scopes the base queryset to
        the requesting user / parent. Receives ``(request, **url_kwargs)``.
    :param on_create: Optional callable invoked on POST before the file
        ingest pipeline runs. Receives ``(request, instance, **url_kwargs)``
        and may set FK fields on ``instance`` in place.
    :param serializer_class: Override the default
        :func:`build_attachment_serializer` output.
    :param singleton: When ``True``, generate the singleton URL set
        (no ``<pk>`` segments). Otherwise, generate the multi URL set.
    """
    base = _normalise_prefix(prefix)
    suffix = "/" if base else ""
    base_route = f"{base}{suffix}"

    views = build_views(
        model_class,
        permissions=permissions,
        queryset=queryset,
        on_create=on_create,
        serializer_class=serializer_class,
        singleton=singleton,
    )

    name_root = model_class.__name__.lower()

    patterns: list = []

    if singleton:
        patterns.append(
            path(
                base_route,
                views["object"].as_view(),
                name=f"{name_root}-object",
            )
        )
        if "versions" in views:
            patterns.append(
                path(
                    f"{base}/versions/",
                    views["versions"].as_view(),
                    name=f"{name_root}-versions",
                )
            )
        if "version_detail" in views:
            patterns.append(
                path(
                    f"{base}/versions/<int:version>/",
                    views["version_detail"].as_view(),
                    name=f"{name_root}-version-detail",
                )
            )
        patterns.append(
            path(
                f"{base}/download/",
                views["download"].as_view(),
                name=f"{name_root}-download",
            )
        )
        return patterns

    # Multi mode
    patterns.extend(
        [
            path(
                base_route,
                views["collection"].as_view(),
                name=f"{name_root}-list",
            ),
            path(
                f"{base}/<int:pk>/",
                views["detail"].as_view(),
                name=f"{name_root}-detail",
            ),
            path(
                f"{base}/<int:pk>/versions/",
                views["versions"].as_view(),
                name=f"{name_root}-versions",
            ),
            path(
                f"{base}/<int:pk>/download/",
                views["download"].as_view(),
                name=f"{name_root}-download",
            ),
        ]
    )
    return patterns


__all__ = ["register_attachment_endpoints"]
