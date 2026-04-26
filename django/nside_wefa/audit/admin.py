"""
Read-only Django admin for audit ``LogEntry`` rows.

This is the first ``admin.py`` shipped by the WeFa toolkit and sets the
pattern referenced by catalog item L1: every shipped model is admin-visible,
audit events specifically are read-only.
"""

from typing import Any, Optional

from auditlog.models import LogEntry
from django.contrib import admin
from django.contrib.admin.exceptions import NotRegistered
from django.http import HttpRequest

# Auditlog ships its own admin registration. Replace it with the WeFa
# read-only variant so consumers see WeFa-style action labels and outcomes.
try:
    admin.site.unregister(LogEntry)
except NotRegistered:
    pass


@admin.register(LogEntry)
class LogEntryAdmin(admin.ModelAdmin):
    """Read-only admin for ``LogEntry``.

    All fields are exposed but every mutation pathway (add / change /
    delete) is disabled. Useful for ops staff who need to inspect what
    happened without risking accidental edits.
    """

    list_display = (
        "timestamp",
        "action_label",
        "actor_label",
        "object_repr",
        "outcome_label",
    )
    list_filter = ("action", "timestamp", "content_type")
    search_fields = (
        "object_repr",
        "actor__username",
        "actor_email",
        "additional_data",
        "cid",
    )
    date_hierarchy = "timestamp"
    ordering = ("-timestamp",)

    readonly_fields = (
        "timestamp",
        "action",
        "actor",
        "actor_email",
        "content_type",
        "object_pk",
        "object_id",
        "object_repr",
        "changes",
        "changes_text",
        "additional_data",
        "remote_addr",
        "remote_port",
        "cid",
        "serialized_data",
    )

    def has_add_permission(self, request: HttpRequest) -> bool:  # noqa: D401
        return False

    def has_change_permission(
        self, request: HttpRequest, obj: Optional[Any] = None
    ) -> bool:  # noqa: D401
        return False

    def has_delete_permission(
        self, request: HttpRequest, obj: Optional[Any] = None
    ) -> bool:  # noqa: D401
        return False

    @admin.display(description="action")
    def action_label(self, obj: LogEntry) -> str:
        wefa_action = (obj.additional_data or {}).get("action")
        if wefa_action:
            return f"{wefa_action} ({obj.get_action_display()})"
        return obj.get_action_display()

    @admin.display(description="actor")
    def actor_label(self, obj: LogEntry) -> str:
        if obj.actor is not None:
            return str(obj.actor)
        if obj.actor_email:
            return obj.actor_email
        return "system"

    @admin.display(description="outcome")
    def outcome_label(self, obj: LogEntry) -> str:
        return (obj.additional_data or {}).get("outcome", "")
