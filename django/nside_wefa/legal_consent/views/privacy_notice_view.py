"""
Views for serving privacy-related legal documents.

This module exposes an API view that returns the Privacy Notice markdown
content with basic templating applied.
"""

from django.http import HttpResponse
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.request import Request
from drf_spectacular.utils import extend_schema, OpenApiResponse

from nside_wefa.legal_consent.views.utils import get_document_content


class PrivacyNoticeView(APIView):
    """
    API view for serving the Privacy Notice document.

    This view serves the Privacy Notice markdown document with app name templating.
    The document can be overridden by implementing projects by placing their own
    privacy_notice.md file in their project's templates/legal_consent/ directory.

    Supported HTTP Methods:
        GET: Returns the Privacy Notice document as plain text
    """

    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="legal_consent_privacy_notice",
        tags=["LegalConsent"],
        summary="Get Privacy Notice",
        description="Retrieve the Privacy Notice document with app name templating applied. "
        "The document can be overridden by implementing projects.",
        responses={
            200: OpenApiResponse(
                description="Privacy Notice document successfully retrieved",
            ),
        },
    )
    def get(self, request: Request) -> HttpResponse:
        """
        Get the Privacy Notice document with app name templating applied.

        Accepts an optional 'locale' query parameter to select the localized
        document from a locale subfolder (defaults to 'en').
        The view first looks for a custom privacy_notice.md file in the project's
        templates/legal_consent/<locale>/ directory. If not found, it uses the default template
        from the LegalConsent app.
        """
        locale = request.query_params.get("locale", "en")
        content = get_document_content("privacy_notice.md", locale=locale)
        return HttpResponse(content, content_type="text/plain; charset=utf-8")
