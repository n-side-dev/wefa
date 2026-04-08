"""
Recipe planning endpoint for the AI assistant.
"""

from __future__ import annotations

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from nside_wefa.ai_assistant.serializers import AssistantPlanningRequestSerializer
from nside_wefa.ai_assistant.services.docs import get_ai_assistant_settings
from nside_wefa.ai_assistant.services.planner import (
    AssistantPlanningServiceError,
    AssistantPlanningUpstreamError,
    plan_recipe,
)


class AssistantRecipeView(APIView):
    """Generate a structured recipe or clarification response for a prompt."""

    def get_permissions(self):
        """Allow projects to require authentication for assistant planning."""
        settings = get_ai_assistant_settings()
        permission_classes = (
            [IsAuthenticated] if settings["REQUIRE_AUTHENTICATION"] else [AllowAny]
        )
        return [permission() for permission in permission_classes]

    @extend_schema(
        operation_id="ai_assistant_recipe_plan",
        tags=["AIAssistant"],
        summary="Plan a structured recipe from a prompt",
        description=(
            "Generate a recipe, clarification questions, or an unsupported response based on the "
            "frontend route manifest and richer backend action documentation."
        ),
        request=AssistantPlanningRequestSerializer,
        responses={
            200: OpenApiResponse(description="Structured assistant planning result."),
            400: OpenApiResponse(
                description="Invalid request payload or planning failure."
            ),
        },
    )
    def post(self, request: Request) -> Response:
        """Validate the frontend request and return a structured planning result."""
        serializer = AssistantPlanningRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        try:
            response_payload = plan_recipe(
                prompt=data["prompt"],
                locale=data["locale"],
                route_manifest=data["route_manifest"],
                current_route=data.get("current_route"),
                user=request.user,
                conversation_token=data.get("conversation_token", ""),
                answers=data.get("answers", []),
            )
        except AssistantPlanningUpstreamError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except AssistantPlanningServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(response_payload)
