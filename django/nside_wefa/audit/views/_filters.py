"""
Hand-rolled query-param filtering for audit list endpoints.

Avoids forcing ``django-filter`` as a hard dependency. Stays small on
purpose — when catalog item F3 (filtering preset) lands, swap this for the
shared filterset.
"""

from typing import Any, Iterable, Optional, Tuple

from django.contrib.contenttypes.models import ContentType
from django.db.models import QuerySet
from django.utils.dateparse import parse_datetime


def apply_filters(
    queryset: QuerySet, query_params: Any, allowed: Iterable[str]
) -> Tuple[QuerySet, Optional[str]]:
    """Apply audit-event filters to ``queryset``.

    Returns ``(queryset, error_message)``. ``error_message`` is non-None when
    a query parameter is malformed; the caller should return a 400 response
    with that message.
    """
    allowed_set = set(allowed)

    if "action" in query_params and "action" in allowed_set:
        queryset = queryset.filter(additional_data__action=query_params["action"])
    if "action__startswith" in query_params and "action" in allowed_set:
        queryset = queryset.filter(
            additional_data__action__startswith=query_params["action__startswith"]
        )

    if "actor" in query_params and "actor" in allowed_set:
        try:
            actor_id = int(query_params["actor"])
        except (TypeError, ValueError):
            return queryset, "Invalid 'actor' value: expected an integer user id."
        queryset = queryset.filter(actor_id=actor_id)

    if "outcome" in query_params:
        queryset = queryset.filter(additional_data__outcome=query_params["outcome"])

    if "cid" in query_params:
        queryset = queryset.filter(cid=query_params["cid"])

    if "target_type" in query_params:
        label = query_params["target_type"]
        if "." not in label:
            return (
                queryset,
                "Invalid 'target_type' value: expected 'app_label.model_name'.",
            )
        app_label, model = label.split(".", 1)
        try:
            ct = ContentType.objects.get(app_label=app_label, model=model)
        except ContentType.DoesNotExist:
            return queryset, f"Unknown 'target_type' {label!r}."
        queryset = queryset.filter(content_type=ct)

    if "target_id" in query_params:
        queryset = queryset.filter(object_pk=str(query_params["target_id"]))

    if "timestamp__gte" in query_params:
        parsed = parse_datetime(query_params["timestamp__gte"])
        if parsed is None:
            return (
                queryset,
                "Invalid 'timestamp__gte' value: expected ISO-8601 datetime.",
            )
        queryset = queryset.filter(timestamp__gte=parsed)

    if "timestamp__lte" in query_params:
        parsed = parse_datetime(query_params["timestamp__lte"])
        if parsed is None:
            return (
                queryset,
                "Invalid 'timestamp__lte' value: expected ISO-8601 datetime.",
            )
        queryset = queryset.filter(timestamp__lte=parsed)

    return queryset, None
