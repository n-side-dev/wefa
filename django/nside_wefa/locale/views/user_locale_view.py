from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiResponse

from ..models import UserLocale
from ..serializers import UserLocaleSerializer


class UserLocaleView(APIView):
    """
    API view for reading and updating the authenticated user's preferred locale.

    Supported HTTP Methods:
        GET: Returns the stored locale code for the authenticated user.
        PATCH: Updates the stored locale code for the authenticated user.

    Authentication:
        Required. Users must be authenticated to access any endpoint.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = UserLocaleSerializer

    @extend_schema(
        operation_id="user_locale_get",
        tags=["Locale"],
        summary="Get User Locale",
        description="Retrieve the preferred locale code stored for the authenticated user. "
        "If the user has not chosen a locale yet, ``code`` is returned as null.",
        responses={
            200: OpenApiResponse(
                response=UserLocaleSerializer,
                description="User locale information successfully retrieved",
            ),
            401: OpenApiResponse(
                description="Authentication required - user must be logged in"
            ),
        },
    )
    def get(self, request: Request) -> Response:
        """Return the current user's preferred locale."""
        try:
            user_locale = UserLocale.objects.get(user=request.user)
        except UserLocale.DoesNotExist:
            # This shouldn't happen due to the signal, but handle it gracefully
            user_locale = UserLocale.objects.create(user=request.user)

        serializer = UserLocaleSerializer(user_locale)
        return Response(serializer.data)

    @extend_schema(
        operation_id="user_locale_update",
        tags=["Locale"],
        summary="Update User Locale",
        description="Update the preferred locale code stored for the authenticated user. "
        "The submitted ``code`` must be one of NSIDE_WEFA.LOCALE.AVAILABLE.",
        request=UserLocaleSerializer,
        responses={
            200: OpenApiResponse(
                response=UserLocaleSerializer,
                description="User locale information successfully updated",
            ),
            400: OpenApiResponse(description="Invalid locale code"),
            401: OpenApiResponse(
                description="Authentication required - user must be logged in"
            ),
        },
    )
    def patch(self, request: Request) -> Response:
        """Update the current user's preferred locale."""
        try:
            user_locale = UserLocale.objects.get(user=request.user)
        except UserLocale.DoesNotExist:
            # This shouldn't happen due to the signal, but handle it gracefully
            user_locale = UserLocale.objects.create(user=request.user)

        serializer = UserLocaleSerializer(user_locale, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
