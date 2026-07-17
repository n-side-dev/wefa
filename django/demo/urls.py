"""
URL configuration for demo project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("legal-consent/", include("nside_wefa.legal_consent.urls")),
    path("authentication/", include("nside_wefa.authentication.urls")),
    path("locale/", include("nside_wefa.locale.urls")),
    path("audit/", include("nside_wefa.audit.urls")),
    # Demo apps — illustrate how a consumer wires the attachments
    # library into their own URL tree. The avatar endpoints live under
    # /me/avatar/ (singleton) and the documents endpoints under
    # /documents/ (multi).
    path("", include("demo.profiles.urls")),
    path("", include("demo.documents.urls")),
]
