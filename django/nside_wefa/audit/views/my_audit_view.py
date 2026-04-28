"""``GET /audit/me/`` — the authenticated user's own audit events."""

from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers import AuditEventSerializer
from ._filters import apply_filters
from .audit_events_view import _logentry_model, _serializer_class

ME_FILTERS = (
    "action",
    "action__startswith",
    "outcome",
    "cid",
    "target_type",
    "target_id",
    "timestamp__gte",
    "timestamp__lte",
)


class MyAuditEventListView(APIView):
    """List audit events the authenticated user is the actor of."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="audit_me_list",
        tags=["Audit"],
        summary="List My Audit Events",
        description=(
            "Return a paginated list of audit events whose actor is the "
            "authenticated user. Same filter set as the staff endpoint, "
            "minus `actor` (always implicitly the current user)."
        ),
        parameters=[
            OpenApiParameter(name=f, type=str, required=False) for f in ME_FILTERS
        ],
        responses={
            200: OpenApiResponse(response=AuditEventSerializer(many=True)),
            401: OpenApiResponse(description="Authentication required."),
        },
    )
    def get(self, request: Request) -> Response:
        queryset = (
            _logentry_model()
            .objects.filter(actor=request.user)
            .order_by("-timestamp", "-id")
        )
        queryset, error = apply_filters(queryset, request.query_params, ME_FILTERS)
        if error is not None:
            return Response({"detail": error}, status=status.HTTP_400_BAD_REQUEST)

        serializer = _serializer_class()(queryset, many=True)
        return Response(serializer.data)
