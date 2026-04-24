"""
Locale URL Configuration

This module provides URL patterns for the Locale app. These URLs are designed
to be included in other Django projects as part of an installable app.

Include these URLs in your main urls.py::

    from django.urls import path, include

    urlpatterns = [
       ...
       path('locale/', include('nside_wefa.locale.urls')),
       ...
    ]

Available endpoints:
    - GET /locale/user/ : Get the authenticated user's preferred locale
    - PATCH /locale/user/ : Update the authenticated user's preferred locale
    - GET /locale/available/ : Get the list of supported locales (public)
"""

from django.urls import path

from .views import AvailableLocalesView, UserLocaleView

app_name = "locale"

urlpatterns = [
    path("user/", UserLocaleView.as_view(), name="user_locale"),
    path("available/", AvailableLocalesView.as_view(), name="available_locales"),
]
