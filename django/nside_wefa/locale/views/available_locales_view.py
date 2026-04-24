from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema, OpenApiResponse

from ..models.user_locale import _LocaleConfiguration
from ..serializers import AvailableLocalesSerializer


class AvailableLocalesView(APIView):
    """
    Public API view that returns the locales supported by this project.

    This endpoint is anonymous on purpose: frontend clients need to know the
    available choices before a user authenticates (for example, to render a
    locale picker on a public landing page).
    """

    permission_classes = [AllowAny]
    serializer_class = AvailableLocalesSerializer

    @extend_schema(
        operation_id="available_locales_get",
        tags=["Locale"],
        summary="List Available Locales",
        description="Return the list of locale codes supported by this project "
        "along with the default locale.",
        responses={
            200: OpenApiResponse(
                response=AvailableLocalesSerializer,
                description="Available locales successfully retrieved",
            ),
        },
    )
    def get(self, request: Request) -> Response:
        """Return the configured available locales and the default."""
        configuration = _LocaleConfiguration()
        serializer = AvailableLocalesSerializer(
            {"available": configuration.available, "default": configuration.default}
        )
        return Response(serializer.data)
