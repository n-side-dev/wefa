"""
Serializers for audit ``LogEntry`` rows.

The default :class:`AuditEventSerializer` is read-only and exposes the fields
that matter to operators and end users alike. The
:class:`AuditEventIntegritySerializer` adds the hash-chain columns and is
used only by the staff detail endpoint when tamper-evidence is enabled.
"""

from typing import Any, Optional

from auditlog.models import LogEntry
from drf_spectacular.utils import extend_schema_field, extend_schema_serializer
from rest_framework import serializers


@extend_schema_serializer(component_name="AuditEvent")
class AuditEventSerializer(serializers.ModelSerializer):
    """Default read-only representation of a :class:`LogEntry`."""

    action = serializers.SerializerMethodField(
        help_text="The WeFa-style action identifier (e.g. 'auth.login'), "
        "falling back to auditlog's verb when none was set."
    )
    actor = serializers.SerializerMethodField(
        help_text="String representation of the actor (or 'system' when unset)."
    )
    actor_id = serializers.IntegerField(read_only=True, allow_null=True)
    target = serializers.SerializerMethodField(
        help_text="String representation of the target object (if any)."
    )
    target_type = serializers.SerializerMethodField(
        help_text="`app_label.model_name` of the target's content type."
    )
    target_id = serializers.CharField(
        source="object_pk",
        read_only=True,
        allow_blank=True,
        help_text="Primary key of the target object, as a string.",
    )
    outcome = serializers.SerializerMethodField()
    metadata = serializers.SerializerMethodField()

    class Meta:
        model = LogEntry
        fields = [
            "id",
            "timestamp",
            "action",
            "actor",
            "actor_id",
            "target",
            "target_type",
            "target_id",
            "changes",
            "outcome",
            "metadata",
            "remote_addr",
            "cid",
        ]
        read_only_fields = fields

    @extend_schema_field(serializers.CharField())
    def get_action(self, obj: LogEntry) -> str:
        return (obj.additional_data or {}).get("action") or obj.get_action_display()

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_actor(self, obj: LogEntry) -> Optional[str]:
        if obj.actor is not None:
            return str(obj.actor)
        return obj.actor_email or None

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_target(self, obj: LogEntry) -> Optional[str]:
        return obj.object_repr or None

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_target_type(self, obj: LogEntry) -> Optional[str]:
        if obj.content_type_id is None or obj.content_type is None:
            return None
        return f"{obj.content_type.app_label}.{obj.content_type.model}"

    @extend_schema_field(serializers.CharField())
    def get_outcome(self, obj: LogEntry) -> str:
        return (obj.additional_data or {}).get("outcome") or "success"

    @extend_schema_field(serializers.JSONField())
    def get_metadata(self, obj: LogEntry) -> Any:
        return (obj.additional_data or {}).get("metadata", {})


@extend_schema_serializer(component_name="AuditEventIntegrity")
class AuditEventIntegritySerializer(AuditEventSerializer):
    """Variant that exposes the tamper-evident hash chain columns."""

    prev_hash = serializers.CharField(read_only=True, required=False, allow_blank=True)
    hash = serializers.CharField(read_only=True, required=False, allow_blank=True)

    class Meta(AuditEventSerializer.Meta):
        fields = AuditEventSerializer.Meta.fields + ["prev_hash", "hash"]
