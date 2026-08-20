"""View factory for the attachments app.

Generates concrete :class:`~rest_framework.views.APIView` subclasses bound
to a consumer's :class:`Attachment` subclass. Two modes:

- **Singleton** — one logical attachment per scope (avatar, contract PDF).
  POST creates v1 or bumps v+1; URLs do not contain ``<id>``.
- **Multi** — many logical attachments per scope. POST creates a new
  logical attachment; ``POST /<pk>/versions/`` bumps a specific one.

The factory returns a dict of ``{role: view_class}`` consumed by
:mod:`nside_wefa.attachments.urls`.
"""

from __future__ import annotations

from typing import Any, Callable, Iterable, Optional, Type

from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import FileResponse
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Attachment
from ..serializers import build_attachment_serializer

# Sentinel used as "no permission override" so we can distinguish from
# an explicit empty list.
_DEFAULT_PERMISSIONS: list[Type[BasePermission]] = []

QuerysetCallable = Callable[..., Any]
OnCreateCallable = Callable[..., None]


def _resolve_queryset(
    model_class: Type[Attachment],
    queryset_factory: Optional[QuerysetCallable],
    request: Request,
    **url_kwargs: Any,
):
    """Return the base queryset, scoped if a factory was provided."""
    if queryset_factory is None:
        return model_class.objects.all()
    qs = queryset_factory(request, **url_kwargs)
    return qs


def _extract_file(request: Request):
    """Pull the uploaded file from ``request.FILES['file']`` or raise 400."""
    upload = request.FILES.get("file")
    if upload is None:
        raise DRFValidationError({"file": "Missing required upload field 'file'."})
    return upload


def _to_drf_validation_error(exc: DjangoValidationError) -> DRFValidationError:
    """Render a Django ValidationError as a DRF ValidationError."""
    if hasattr(exc, "message_dict"):
        return DRFValidationError(exc.message_dict)
    if hasattr(exc, "messages"):
        return DRFValidationError({"file": exc.messages})
    return DRFValidationError({"file": [str(exc)]})


def _stream_file_response(instance: Attachment) -> FileResponse:
    """Return a streamed response for the attachment blob."""
    file_handle = instance.file.open("rb")
    response = FileResponse(
        file_handle,
        content_type=instance.content_type,
        as_attachment=True,
        filename=instance.filename,
    )
    return response


def build_views(
    model_class: Type[Attachment],
    *,
    permissions: Iterable[Type[BasePermission]] = (),
    queryset: Optional[QuerysetCallable] = None,
    on_create: Optional[OnCreateCallable] = None,
    serializer_class=None,
    singleton: bool = False,
) -> dict[str, Type[APIView]]:
    """Build a dict of view classes for ``model_class``.

    Returns the views the URL helper expects:

    - ``"singleton"`` mode: ``{"object", "versions", "version_detail",
      "download"}``. ``"versions"`` and ``"version_detail"`` are omitted
      when the model has ``versioning_enabled=False``.
    - ``"multi"`` mode: ``{"collection", "detail", "versions",
      "download"}``.
    """
    # Validate the subclass declares the required knobs *before* the
    # server starts servicing requests.
    model_class._check_subclass_configuration()

    _perms = list(permissions) or _DEFAULT_PERMISSIONS
    serializer = serializer_class or build_attachment_serializer(model_class)
    versioned = model_class.versioning_enabled

    schema_tag = model_class.__name__

    # ------------------------------------------------------------------
    # Helpers shared by both modes
    # ------------------------------------------------------------------

    def _create_or_replace_in_singleton_scope(
        request: Request, **url_kwargs: Any
    ) -> Attachment:
        """The body of POST in singleton mode.

        Acquires a row-level lock over the scoped queryset, then either
        inserts v1, bumps v+1, or replaces in place depending on the
        configured versioning mode.
        """
        from django.db import transaction

        upload = _extract_file(request)
        base_qs = _resolve_queryset(model_class, queryset, request, **url_kwargs)
        with transaction.atomic():
            existing_qs = base_qs.select_for_update().filter(is_current=True)
            existing = list(existing_qs[:1])

            if not existing:
                instance = model_class(
                    is_current=True,
                    version=1,
                    uploaded_by=getattr(request.user, "is_authenticated", False)
                    and request.user
                    or None,
                )
                if on_create is not None:
                    on_create(request, instance, **url_kwargs)
                try:
                    instance._ingest_file(upload)
                except DjangoValidationError as exc:
                    raise _to_drf_validation_error(exc) from exc
                instance.save()
                return instance

            current = existing[0]
            if versioned:
                try:
                    new_row = model_class.add_version(
                        file=upload,
                        parent=current,
                        uploaded_by=getattr(request.user, "is_authenticated", False)
                        and request.user
                        or None,
                    )
                except DjangoValidationError as exc:
                    raise _to_drf_validation_error(exc) from exc
                return new_row

            try:
                current.replace_in_place(
                    file=upload,
                    uploaded_by=getattr(request.user, "is_authenticated", False)
                    and request.user
                    or None,
                )
            except DjangoValidationError as exc:
                raise _to_drf_validation_error(exc) from exc
            return current

    # ------------------------------------------------------------------
    # Singleton mode views
    # ------------------------------------------------------------------

    if singleton:

        class SingletonObjectView(APIView):
            """``GET / POST / DELETE`` on the singleton scope."""

            permission_classes = _perms

            @extend_schema(
                operation_id=f"{schema_tag}_get_current",
                tags=[schema_tag],
                summary=f"Get current {schema_tag}",
                responses={
                    200: OpenApiResponse(response=serializer),
                    404: OpenApiResponse(description="No attachment in this scope."),
                },
            )
            def get(self, request: Request, **kwargs: Any) -> Response:
                qs = _resolve_queryset(model_class, queryset, request, **kwargs)
                obj = qs.filter(is_current=True).first()
                if obj is None:
                    raise NotFound("No attachment in this scope.")
                return Response(serializer(obj).data)

            @extend_schema(
                operation_id=f"{schema_tag}_upload",
                tags=[schema_tag],
                summary=(
                    f"Upload (or version) the {schema_tag}"
                    if versioned
                    else f"Upload (or replace) the {schema_tag}"
                ),
                request={
                    "multipart/form-data": {
                        "type": "object",
                        "properties": {"file": {"type": "string", "format": "binary"}},
                        "required": ["file"],
                    }
                },
                responses={
                    200: OpenApiResponse(response=serializer),
                    201: OpenApiResponse(response=serializer),
                    400: OpenApiResponse(description="Validation error."),
                },
            )
            def post(self, request: Request, **kwargs: Any) -> Response:
                instance = _create_or_replace_in_singleton_scope(request, **kwargs)
                http_status = (
                    status.HTTP_201_CREATED
                    if instance.version == 1
                    else status.HTTP_200_OK
                )
                return Response(serializer(instance).data, status=http_status)

            @extend_schema(
                operation_id=f"{schema_tag}_delete",
                tags=[schema_tag],
                summary=f"Delete the {schema_tag} (all versions)",
                responses={
                    204: OpenApiResponse(description="Deleted."),
                    404: OpenApiResponse(description="No attachment in this scope."),
                },
            )
            def delete(self, request: Request, **kwargs: Any) -> Response:
                qs = _resolve_queryset(model_class, queryset, request, **kwargs)
                rows = list(qs.all())
                if not rows:
                    raise NotFound("No attachment in this scope.")
                # Group by attachment_uid; delete each blob.
                seen_uids: set = set()
                for row in rows:
                    if row.attachment_uid in seen_uids:
                        continue
                    seen_uids.add(row.attachment_uid)
                    model_class.hard_delete_logical(row.attachment_uid)
                return Response(status=status.HTTP_204_NO_CONTENT)

        class SingletonVersionsView(APIView):
            """``GET`` history list for the singleton scope."""

            permission_classes = _perms

            @extend_schema(
                operation_id=f"{schema_tag}_versions",
                tags=[schema_tag],
                summary=f"List {schema_tag} versions",
                responses={
                    200: OpenApiResponse(response=serializer(many=True)),
                    404: OpenApiResponse(description="No attachment in this scope."),
                },
            )
            def get(self, request: Request, **kwargs: Any) -> Response:
                qs = _resolve_queryset(model_class, queryset, request, **kwargs)
                rows = list(qs.order_by("version"))
                if not rows:
                    raise NotFound("No attachment in this scope.")
                return Response(serializer(rows, many=True).data)

        class SingletonVersionDetailView(APIView):
            """``GET`` a specific version by version number."""

            permission_classes = _perms

            @extend_schema(
                operation_id=f"{schema_tag}_version_detail",
                tags=[schema_tag],
                summary=f"Get a specific {schema_tag} version",
                responses={
                    200: OpenApiResponse(response=serializer),
                    404: OpenApiResponse(description="No such version."),
                },
            )
            def get(self, request: Request, version: int, **kwargs: Any) -> Response:
                qs = _resolve_queryset(model_class, queryset, request, **kwargs)
                obj = qs.filter(version=version).first()
                if obj is None:
                    raise NotFound("No such version.")
                return Response(serializer(obj).data)

        class SingletonDownloadView(APIView):
            """``GET`` stream of the current version's bytes."""

            permission_classes = _perms

            @extend_schema(
                operation_id=f"{schema_tag}_download",
                tags=[schema_tag],
                summary=f"Download the current {schema_tag}",
                responses={
                    200: OpenApiResponse(description="Binary stream."),
                    404: OpenApiResponse(description="No attachment in this scope."),
                },
            )
            def get(self, request: Request, **kwargs: Any) -> FileResponse:
                qs = _resolve_queryset(model_class, queryset, request, **kwargs)
                obj = qs.filter(is_current=True).first()
                if obj is None:
                    raise NotFound("No attachment in this scope.")
                return _stream_file_response(obj)

        out: dict[str, Type[APIView]] = {
            "object": SingletonObjectView,
            "download": SingletonDownloadView,
        }
        if versioned:
            out["versions"] = SingletonVersionsView
            out["version_detail"] = SingletonVersionDetailView
        return out

    # ------------------------------------------------------------------
    # Multi-mode views
    # ------------------------------------------------------------------

    class CollectionView(APIView):
        """``GET`` list of current rows; ``POST`` create new logical attachment."""

        permission_classes = _perms

        @extend_schema(
            operation_id=f"{schema_tag}_list",
            tags=[schema_tag],
            summary=f"List current {schema_tag}",
            responses={200: OpenApiResponse(response=serializer(many=True))},
        )
        def get(self, request: Request, **kwargs: Any) -> Response:
            qs = _resolve_queryset(model_class, queryset, request, **kwargs)
            qs = qs.filter(is_current=True)
            return Response(serializer(qs, many=True).data)

        @extend_schema(
            operation_id=f"{schema_tag}_create",
            tags=[schema_tag],
            summary=f"Create a new {schema_tag} (v1)",
            request={
                "multipart/form-data": {
                    "type": "object",
                    "properties": {"file": {"type": "string", "format": "binary"}},
                    "required": ["file"],
                }
            },
            responses={
                201: OpenApiResponse(response=serializer),
                400: OpenApiResponse(description="Validation error."),
            },
        )
        def post(self, request: Request, **kwargs: Any) -> Response:
            upload = _extract_file(request)
            instance = model_class(
                is_current=True,
                version=1,
                uploaded_by=getattr(request.user, "is_authenticated", False)
                and request.user
                or None,
            )
            if on_create is not None:
                on_create(request, instance, **kwargs)
            try:
                instance._ingest_file(upload)
            except DjangoValidationError as exc:
                raise _to_drf_validation_error(exc) from exc
            instance.save()
            return Response(serializer(instance).data, status=status.HTTP_201_CREATED)

    class DetailView(APIView):
        """``GET`` retrieve a specific row; ``DELETE`` hard-delete the whole logical attachment."""

        permission_classes = _perms

        @extend_schema(
            operation_id=f"{schema_tag}_detail",
            tags=[schema_tag],
            summary=f"Retrieve a {schema_tag}",
            responses={
                200: OpenApiResponse(response=serializer),
                404: OpenApiResponse(description="Not found."),
            },
        )
        def get(self, request: Request, pk: int, **kwargs: Any) -> Response:
            qs = _resolve_queryset(model_class, queryset, request, **kwargs)
            try:
                obj = qs.get(pk=pk)
            except model_class.DoesNotExist as exc:
                raise NotFound() from exc
            return Response(serializer(obj).data)

        @extend_schema(
            operation_id=f"{schema_tag}_delete",
            tags=[schema_tag],
            summary=f"Delete a {schema_tag} (all versions)",
            responses={
                204: OpenApiResponse(description="Deleted."),
                404: OpenApiResponse(description="Not found."),
            },
        )
        def delete(self, request: Request, pk: int, **kwargs: Any) -> Response:
            qs = _resolve_queryset(model_class, queryset, request, **kwargs)
            try:
                obj = qs.get(pk=pk)
            except model_class.DoesNotExist as exc:
                raise NotFound() from exc
            model_class.hard_delete_logical(obj.attachment_uid)
            return Response(status=status.HTTP_204_NO_CONTENT)

    class VersionsView(APIView):
        """``GET`` history; ``POST`` bump the logical attachment identified by ``pk``."""

        permission_classes = _perms

        @extend_schema(
            operation_id=f"{schema_tag}_versions",
            tags=[schema_tag],
            summary=f"List versions of a {schema_tag}",
            responses={
                200: OpenApiResponse(response=serializer(many=True)),
                404: OpenApiResponse(description="Not found."),
            },
        )
        def get(self, request: Request, pk: int, **kwargs: Any) -> Response:
            qs = _resolve_queryset(model_class, queryset, request, **kwargs)
            try:
                anchor = qs.get(pk=pk)
            except model_class.DoesNotExist as exc:
                raise NotFound() from exc
            history = model_class.objects.history(anchor.attachment_uid)
            return Response(serializer(history, many=True).data)

        @extend_schema(
            operation_id=f"{schema_tag}_add_version",
            tags=[schema_tag],
            summary=f"Add a new version to a {schema_tag}",
            request={
                "multipart/form-data": {
                    "type": "object",
                    "properties": {"file": {"type": "string", "format": "binary"}},
                    "required": ["file"],
                }
            },
            responses={
                201: OpenApiResponse(response=serializer),
                400: OpenApiResponse(description="Validation error."),
                404: OpenApiResponse(description="Not found."),
                409: OpenApiResponse(
                    description=(
                        "Versioning disabled for this attachment subclass; "
                        "use POST on the row to replace in place."
                    )
                ),
            },
        )
        def post(self, request: Request, pk: int, **kwargs: Any) -> Response:
            qs = _resolve_queryset(model_class, queryset, request, **kwargs)
            try:
                anchor = qs.get(pk=pk)
            except model_class.DoesNotExist as exc:
                raise NotFound() from exc

            upload = _extract_file(request)
            if not versioned:
                # When versioning is disabled, this endpoint replaces the
                # row in place rather than 409-ing — the route exists in
                # the URL set only when versioning is enabled, so reaching
                # this branch means the registration helper allowed it.
                try:
                    anchor.replace_in_place(
                        file=upload,
                        uploaded_by=getattr(request.user, "is_authenticated", False)
                        and request.user
                        or None,
                    )
                except DjangoValidationError as exc:
                    raise _to_drf_validation_error(exc) from exc
                return Response(serializer(anchor).data, status=status.HTTP_200_OK)

            try:
                new_row = model_class.add_version(
                    file=upload,
                    parent=anchor,
                    uploaded_by=getattr(request.user, "is_authenticated", False)
                    and request.user
                    or None,
                )
            except DjangoValidationError as exc:
                raise _to_drf_validation_error(exc) from exc
            return Response(serializer(new_row).data, status=status.HTTP_201_CREATED)

    class DownloadView(APIView):
        """``GET`` stream of a specific row's bytes."""

        permission_classes = _perms

        @extend_schema(
            operation_id=f"{schema_tag}_download",
            tags=[schema_tag],
            summary=f"Download a {schema_tag}",
            responses={
                200: OpenApiResponse(description="Binary stream."),
                404: OpenApiResponse(description="Not found."),
            },
        )
        def get(self, request: Request, pk: int, **kwargs: Any) -> FileResponse:
            qs = _resolve_queryset(model_class, queryset, request, **kwargs)
            try:
                obj = qs.get(pk=pk)
            except model_class.DoesNotExist as exc:
                raise NotFound() from exc
            return _stream_file_response(obj)

    return {
        "collection": CollectionView,
        "detail": DetailView,
        "versions": VersionsView,
        "download": DownloadView,
    }
