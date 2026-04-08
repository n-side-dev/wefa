"""
DRF serializers for the AI assistant request and response contracts.
"""

from __future__ import annotations

from rest_framework import serializers


class AssistantCurrentRouteSerializer(serializers.Serializer):
    """Serialized representation of the frontend route active in the browser."""

    name = serializers.CharField(required=False, allow_blank=True)
    path = serializers.CharField()


class AssistantRouteManifestEntrySerializer(serializers.Serializer):
    """Compact frontend route manifest entry used by backend planning."""

    doc_id = serializers.CharField()
    route_name = serializers.CharField(required=False, allow_blank=True)
    path_template = serializers.CharField()
    label = serializers.CharField()
    section = serializers.CharField(required=False, allow_blank=True)


class AssistantPlanningRequestSerializer(serializers.Serializer):
    """Validated payload received from the frontend assistant mode."""

    prompt = serializers.CharField(trim_whitespace=True)
    conversation_token = serializers.CharField(required=False, allow_blank=True)
    locale = serializers.CharField(required=False, allow_blank=True, default="en")
    current_route = AssistantCurrentRouteSerializer(required=False)
    route_manifest = AssistantRouteManifestEntrySerializer(many=True)
    answers = serializers.ListField(
        child=serializers.CharField(trim_whitespace=True),
        required=False,
        allow_empty=True,
        default=list,
    )

    def validate_route_manifest(
        self, value: list[dict[str, str]]
    ) -> list[dict[str, str]]:
        """Ensure manifest doc IDs are unique."""
        doc_ids = [entry["doc_id"] for entry in value]
        if len(doc_ids) != len(set(doc_ids)):
            raise serializers.ValidationError(
                "route_manifest contains duplicate doc_id values."
            )
        return value


class AssistantQuestionSerializer(serializers.Serializer):
    """Structured clarification question."""

    id = serializers.CharField()
    text = serializers.CharField()


class AssistantStepTargetSerializer(serializers.Serializer):
    """Frontend-resolved target reference for a recipe step."""

    doc_id = serializers.CharField()
    params = serializers.DictField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        default=dict,
    )
    query = serializers.DictField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        default=dict,
    )


class AssistantRecipeStepSerializer(serializers.Serializer):
    """Structured recipe step sent back to the frontend."""

    id = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True, default="")
    target = AssistantStepTargetSerializer(required=False)
    action_label = serializers.CharField(required=False, allow_blank=True, default="")
    depends_on_step_ids = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        default=list,
    )


class AssistantRecipeResponseSerializer(serializers.Serializer):
    """Serializer for a completed recipe planning result."""

    status = serializers.ChoiceField(choices=["recipe"])
    conversation_token = serializers.CharField(
        required=False, allow_blank=True, default=""
    )
    summary = serializers.CharField()
    steps = AssistantRecipeStepSerializer(many=True)
    warnings = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        default=list,
    )


class AssistantClarificationResponseSerializer(serializers.Serializer):
    """Serializer for clarification-needed planning results."""

    status = serializers.ChoiceField(choices=["needs_clarification"])
    conversation_token = serializers.CharField()
    questions = AssistantQuestionSerializer(many=True)
    summary = serializers.CharField(required=False, allow_blank=True, default="")
    warnings = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        default=list,
    )


class AssistantUnsupportedResponseSerializer(serializers.Serializer):
    """Serializer for unsupported prompts."""

    status = serializers.ChoiceField(choices=["unsupported"])
    message = serializers.CharField()
