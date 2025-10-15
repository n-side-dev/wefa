"""
Legal Consent URL Configuration

This module provides URL patterns for the Legal Consent
agreement functionality. These URLs are designed to be included in other Django
projects as part of an installable app.

Include these URLs in your main urls.py:

    from django.urls import path, include

    urlpatterns = [
       ...
       path('legal-consent/', include('legal_consent.urls')),
       ...
    ]

Available endpoints:
    - GET /legal-consent/agreement/ : Get current legal consent status
    - PATCH /legal-consent/agreement/ : Renew/validate legal consent
    - GET /legal-consent/terms-of-use/ : Get Terms of Use document
    - GET /legal-consent/privacy-notice/ : Get Privacy Notice document
"""

from django.urls import path
from .views import LegalConsentView, TermsOfUseView, PrivacyNoticeView

app_name = "legal_consent"

urlpatterns = [
    path("agreement/", LegalConsentView.as_view(), name="legal_consent"),
    path("terms-of-use/", TermsOfUseView.as_view(), name="terms_of_use"),
    path("privacy-notice/", PrivacyNoticeView.as_view(), name="privacy_notice"),
]
