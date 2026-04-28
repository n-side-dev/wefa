"""
Audit URL configuration.

Include in your project::

    from django.urls import include, path

    urlpatterns = [
        ...
        path("audit/", include("nside_wefa.audit.urls")),
        ...
    ]

Available endpoints:
    - GET /audit/events/         : Staff — list every audit event
    - GET /audit/events/<id>/    : Staff — single audit event
    - GET /audit/me/             : Authenticated user — own audit events
"""

from django.urls import path

from .views import AuditEventDetailView, AuditEventListView, MyAuditEventListView

app_name = "audit"

urlpatterns = [
    path("events/", AuditEventListView.as_view(), name="events_list"),
    path(
        "events/<int:event_id>/",
        AuditEventDetailView.as_view(),
        name="events_detail",
    ),
    path("me/", MyAuditEventListView.as_view(), name="my_events"),
]
