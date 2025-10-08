from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiResponse

from ..models import LegalConsent
from ..serializers import LegalConsentSerializer


class LegalConsentView(APIView):
    """
    API view for managing Legal consent status for authenticated users.

    This view provides endpoints to check and update Legal consent status.
    Authentication is required for all operations via IsAuthenticated permission.

    Supported HTTP Methods:
        GET: Returns the current Legal consent status for the authenticated user
        PATCH: Renews/validates the Legal agreement for the authenticated user

    Authentication:
        Required. Users must be authenticated to access any endpoint.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = LegalConsentSerializer

    @extend_schema(
        operation_id="legal_consent_get",
        tags=["LegalConsent"],
        summary="Get Legal Consent Status",
        description="Retrieve the current Legal Consent information for the authenticated user. "
        "Returns comprehensive consent information including version, expiration date, and validity status.",
        responses={
            200: OpenApiResponse(
                response=LegalConsentSerializer,
                description="Legal consent information successfully retrieved",
            ),
            403: OpenApiResponse(
                description="Authentication required - user must be logged in"
            ),
        },
    )
    def get(self, request: Request) -> Response:
        """
        Get the current Legal Consent information for the authenticated user.

        This endpoint uses LegalConsentSerializer to return comprehensive
        agreement information including version, expiration date, and validity status.

        If no LegalConsent exists for the user (unlikely due to signal),
        one will be created automatically with default values.
        """
        try:
            agreement = LegalConsent.objects.get(user=request.user)

        except LegalConsent.DoesNotExist:
            # This shouldn't happen due to the signal, but handle it gracefully
            agreement = LegalConsent.objects.create(user=request.user)

        serializer = LegalConsentSerializer(agreement)
        return Response(serializer.data)

    @extend_schema(
        operation_id="legal_consent_renew",
        tags=["LegalConsent"],
        summary="Renew Legal Consent",
        description="Renew/validate the legal consent for the authenticated user. "
        "Updates the agreement to the current version and extends the expiration date "
        "according to the configured limits.",
        responses={
            200: OpenApiResponse(
                response=LegalConsentSerializer,
                description="Legal Consent successfully renewed with updated information",
            ),
            403: OpenApiResponse(
                description="Authentication required - user must be logged in"
            ),
        },
    )
    def patch(self, request: Request) -> Response:
        """
        Renew/validate the legal consent for the authenticated user.

        This endpoint updates the user's legal consent to the current version
        and extends the expiration date according to the configured limits.

        If no LegalConsent exists for the user (unlikely due to signal),
        one will be created automatically and then renewed.
        """
        try:
            agreement = LegalConsent.objects.get(user=request.user)
            agreement.renew()

            serializer = LegalConsentSerializer(agreement)
            return Response(serializer.data)

        except LegalConsent.DoesNotExist:
            # This shouldn't happen due to the signal, but handle it gracefully
            agreement = LegalConsent.objects.create(user=request.user)
            agreement.renew()

            serializer = LegalConsentSerializer(agreement)
            return Response(serializer.data)
