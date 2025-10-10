from django.http import HttpResponse
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.request import Request
from drf_spectacular.utils import extend_schema, OpenApiResponse

from nside_wefa.legal_consent.views.utils import get_document_content


class TermsOfUseView(APIView):
    """
    API view for serving the Terms of Use document.

    This view serves the Terms of Use markdown document with app name templating.
    The document can be overridden by implementing projects by placing their own
    terms_of_use.md file in their project's templates/legal_consent/ directory.

    Supported HTTP Methods:
        GET: Returns the Terms of Use document as plain text
    """

    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="legal_consent_terms_of_use",
        tags=["LegalConsent"],
        summary="Get Terms of Use",
        description="Retrieve the Terms of Use document with app name templating applied. "
        "The document can be overridden by implementing projects.",
        responses={
            200: OpenApiResponse(
                description="Terms of Use document successfully retrieved",
            ),
        },
    )
    def get(self, request: Request) -> HttpResponse:
        """
        Get the Terms of Use document with app name templating applied.

        Accepts an optional 'locale' query parameter to select the localized
        document from a locale subfolder (defaults to 'en').
        The view first looks for a custom terms_of_use.md file in the project's
        templates/legal_consent/<locale>/ directory. If not found, it uses the default template
        from the LegalConsent app.
        """
        locale = request.query_params.get("locale", "en")
        content = get_document_content("terms_of_use.md", locale=locale)
        return HttpResponse(content, content_type="text/plain; charset=utf-8")
