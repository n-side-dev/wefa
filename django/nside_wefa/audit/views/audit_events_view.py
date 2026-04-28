"""Staff-facing audit-event list and detail views."""

from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from nside_wefa.common.settings import get_section

from ..serializers import AuditEventIntegritySerializer, AuditEventSerializer
from ._filters import apply_filters

LIST_FILTERS = (
    "action",
    "action__startswith",
    "actor",
    "outcome",
    "cid",
    "target_type",
    "target_id",
    "timestamp__gte",
    "timestamp__lte",
)


def _serializer_class():
    """Return the integrity-aware serializer when tamper-evidence is on."""
    if get_section("AUDIT", default={}).get("TAMPER_EVIDENT"):
        return AuditEventIntegritySerializer
    return AuditEventSerializer


def _logentry_model():
    """Return the active LogEntry model class.

    When ``TAMPER_EVIDENT`` is on, this is :class:`WefaLogEntry`; otherwise
    :class:`auditlog.models.LogEntry`.
    """
    from auditlog import get_logentry_model

    return get_logentry_model()


class AuditEventListView(APIView):
    """``GET /audit/events/`` — list every audit event (staff only).

    Supports the filters listed in :data:`LIST_FILTERS`.
    """

    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="audit_events_list",
        tags=["Audit"],
        summary="List Audit Events",
        description=(
            "Return a paginated list of audit events. Staff only. "
            "Filterable by `action`, `actor` (user id), `outcome`, "
            "`target_type` (`app_label.model_name`), `target_id`, `cid`, "
            "and `timestamp__gte` / `timestamp__lte` (ISO-8601 datetimes)."
        ),
        parameters=[
            OpenApiParameter(name=f, type=str, required=False) for f in LIST_FILTERS
        ],
        responses={
            200: OpenApiResponse(response=AuditEventSerializer(many=True)),
            403: OpenApiResponse(
                description="Authentication and staff status required."
            ),
        },
    )
    def get(self, request: Request) -> Response:
        queryset = _logentry_model().objects.all().order_by("-timestamp", "-id")
        queryset, error = apply_filters(queryset, request.query_params, LIST_FILTERS)
        if error is not None:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        serializer = _serializer_class()(queryset, many=True)
        return Response(serializer.data)


class AuditEventDetailView(APIView):
    """``GET /audit/events/<id>/`` — single audit event (staff only)."""

    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id="audit_events_detail",
        tags=["Audit"],
        summary="Get Audit Event",
        description=(
            "Return a single audit event by id. Staff only. "
            "When tamper-evidence is enabled, response includes "
            "`prev_hash` and `hash` columns."
        ),
        responses={
            200: OpenApiResponse(response=AuditEventSerializer),
            404: OpenApiResponse(description="No event with the given id."),
        },
    )
    def get(self, request: Request, event_id: int) -> Response:
        try:
            entry = _logentry_model().objects.get(pk=event_id)
        except _logentry_model().DoesNotExist as exc:
            raise NotFound("Audit event not found.") from exc
        serializer = _serializer_class()(entry)
        return Response(serializer.data)
