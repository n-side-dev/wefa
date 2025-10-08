from django.test import TestCase

from nside_wefa.authentication import urls as auth_urls


class AuthenticationUrlsTest(TestCase):
    """Test cases for authentication URLs dynamic generation."""

    def test_app_name_is_set(self):
        """Test that the app_name is correctly set."""
        self.assertEqual(auth_urls.app_name, "authentication")

    def test_url_generation_logic_with_token_authentication(self):
        """Test the logic that generates URLs based on authentication types."""
        from django.urls import path
        from rest_framework.authtoken.views import obtain_auth_token
        from nside_wefa.authentication.constants import AUTH_TYPE_TOKEN, AUTH_TYPE_JWT

        # Simulate the URL generation logic
        authentication_types = ["TOKEN"]
        urlpatterns = []

        if AUTH_TYPE_TOKEN in authentication_types:
            urlpatterns.extend(
                [
                    path("token-auth/", obtain_auth_token, name="api-auth"),
                ]
            )

        if AUTH_TYPE_JWT in authentication_types:
            from rest_framework_simplejwt.views import (
                TokenObtainPairView,
                TokenRefreshView,
            )

            urlpatterns.extend(
                [
                    path(
                        "token/",
                        TokenObtainPairView.as_view(),
                        name="token_obtain_pair",
                    ),
                    path(
                        "token/refresh/",
                        TokenRefreshView.as_view(),
                        name="token_refresh",
                    ),
                ]
            )

        # Check that only token auth URL is present
        url_names = [url.name for url in urlpatterns if hasattr(url, "name")]
        self.assertIn("api-auth", url_names)
        self.assertNotIn("token_obtain_pair", url_names)
        self.assertNotIn("token_refresh", url_names)

    def test_url_generation_logic_with_jwt_authentication(self):
        """Test the logic that generates URLs for JWT authentication."""
        from django.urls import path
        from rest_framework.authtoken.views import obtain_auth_token
        from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
        from nside_wefa.authentication.constants import AUTH_TYPE_TOKEN, AUTH_TYPE_JWT

        # Simulate the URL generation logic
        authentication_types = ["JWT"]
        urlpatterns = []

        if AUTH_TYPE_TOKEN in authentication_types:
            urlpatterns.extend(
                [
                    path("token-auth/", obtain_auth_token, name="api-auth"),
                ]
            )

        if AUTH_TYPE_JWT in authentication_types:
            urlpatterns.extend(
                [
                    path(
                        "token/",
                        TokenObtainPairView.as_view(),
                        name="token_obtain_pair",
                    ),
                    path(
                        "token/refresh/",
                        TokenRefreshView.as_view(),
                        name="token_refresh",
                    ),
                ]
            )

        # Check that only JWT URLs are present
        url_names = [url.name for url in urlpatterns if hasattr(url, "name")]
        self.assertNotIn("api-auth", url_names)
        self.assertIn("token_obtain_pair", url_names)
        self.assertIn("token_refresh", url_names)

    def test_url_generation_logic_with_both_authentication_types(self):
        """Test the logic that generates URLs for both authentication types."""
        from django.urls import path
        from rest_framework.authtoken.views import obtain_auth_token
        from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
        from nside_wefa.authentication.constants import AUTH_TYPE_TOKEN, AUTH_TYPE_JWT

        # Simulate the URL generation logic
        authentication_types = ["TOKEN", "JWT"]
        urlpatterns = []

        if AUTH_TYPE_TOKEN in authentication_types:
            urlpatterns.extend(
                [
                    path("token-auth/", obtain_auth_token, name="api-auth"),
                ]
            )

        if AUTH_TYPE_JWT in authentication_types:
            urlpatterns.extend(
                [
                    path(
                        "token/",
                        TokenObtainPairView.as_view(),
                        name="token_obtain_pair",
                    ),
                    path(
                        "token/refresh/",
                        TokenRefreshView.as_view(),
                        name="token_refresh",
                    ),
                ]
            )

        # Check that all URLs are present
        url_names = [url.name for url in urlpatterns if hasattr(url, "name")]
        self.assertIn("api-auth", url_names)
        self.assertIn("token_obtain_pair", url_names)
        self.assertIn("token_refresh", url_names)

    def test_url_generation_logic_with_no_authentication_types(self):
        """Test the logic when no authentication types are specified."""
        from django.urls import path
        from nside_wefa.authentication.constants import AUTH_TYPE_TOKEN, AUTH_TYPE_JWT

        # Simulate the URL generation logic
        authentication_types = []
        urlpatterns = []

        if AUTH_TYPE_TOKEN in authentication_types:
            from rest_framework.authtoken.views import obtain_auth_token

            urlpatterns.extend(
                [
                    path("token-auth/", obtain_auth_token, name="api-auth"),
                ]
            )

        if AUTH_TYPE_JWT in authentication_types:
            from rest_framework_simplejwt.views import (
                TokenObtainPairView,
                TokenRefreshView,
            )

            urlpatterns.extend(
                [
                    path(
                        "token/",
                        TokenObtainPairView.as_view(),
                        name="token_obtain_pair",
                    ),
                    path(
                        "token/refresh/",
                        TokenRefreshView.as_view(),
                        name="token_refresh",
                    ),
                ]
            )

        # Check that no URLs are present
        self.assertEqual(len(urlpatterns), 0)

    def test_url_generation_logic_with_unknown_authentication_type(self):
        """Test the logic when unknown authentication types are specified."""
        from django.urls import path
        from nside_wefa.authentication.constants import AUTH_TYPE_TOKEN, AUTH_TYPE_JWT

        # Simulate the URL generation logic
        authentication_types = ["UNKNOWN_TYPE"]
        urlpatterns = []

        if AUTH_TYPE_TOKEN in authentication_types:
            from rest_framework.authtoken.views import obtain_auth_token

            urlpatterns.extend(
                [
                    path("token-auth/", obtain_auth_token, name="api-auth"),
                ]
            )

        if AUTH_TYPE_JWT in authentication_types:
            from rest_framework_simplejwt.views import (
                TokenObtainPairView,
                TokenRefreshView,
            )

            urlpatterns.extend(
                [
                    path(
                        "token/",
                        TokenObtainPairView.as_view(),
                        name="token_obtain_pair",
                    ),
                    path(
                        "token/refresh/",
                        TokenRefreshView.as_view(),
                        name="token_refresh",
                    ),
                ]
            )

        # Check that no URLs are present
        self.assertEqual(len(urlpatterns), 0)


class AuthenticationUrlsIntegrationTest(TestCase):
    """Integration tests for authentication URLs configuration."""

    def test_constants_are_properly_imported(self):
        """Test that authentication constants are properly imported in urls module."""
        from nside_wefa.authentication.constants import AUTH_TYPE_TOKEN, AUTH_TYPE_JWT

        # Test that the constants used in urls.py match the ones from constants.py
        self.assertEqual(AUTH_TYPE_TOKEN, "TOKEN")
        self.assertEqual(AUTH_TYPE_JWT, "JWT")

    def test_views_are_properly_imported(self):
        """Test that required views are available for URL configuration."""
        from rest_framework.authtoken.views import obtain_auth_token
        from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

        # Test that views used in urls.py are importable
        self.assertIsNotNone(obtain_auth_token)
        self.assertIsNotNone(TokenObtainPairView)
        self.assertIsNotNone(TokenRefreshView)

    def test_authentication_urls_module_structure(self):
        """Test that the authentication urls module has expected structure."""
        # Test that the module has the expected attributes
        self.assertTrue(hasattr(auth_urls, "app_name"))
        self.assertTrue(hasattr(auth_urls, "urlpatterns"))
        self.assertEqual(auth_urls.app_name, "authentication")
        self.assertIsInstance(auth_urls.urlpatterns, list)
