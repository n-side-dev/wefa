"""URL set used by the attachments test suite.

Exercises both modes (singleton + multi) and both versioning settings via
real concrete subclasses.
"""

from rest_framework.permissions import IsAuthenticated

from nside_wefa.attachments.urls import register_attachment_endpoints

from .models import (
    AvatarAttachment,
    MultiImageAttachment,
    SingletonPdfAttachment,
)


def _scope_to_owner(request, **kwargs):
    return AvatarAttachment.objects.filter(owner=request.user)


def _bind_avatar_owner(request, instance, **kwargs):
    instance.owner = request.user


def _scope_pdf_to_owner(request, **kwargs):
    return SingletonPdfAttachment.objects.filter(owner=request.user)


def _bind_pdf_owner(request, instance, **kwargs):
    instance.owner = request.user


def _scope_image_to_owner(request, **kwargs):
    return MultiImageAttachment.objects.filter(owner=request.user)


def _bind_image_owner(request, instance, **kwargs):
    instance.owner = request.user


urlpatterns = [
    *register_attachment_endpoints(
        AvatarAttachment,
        prefix="avatar",
        singleton=True,
        permissions=[IsAuthenticated],
        queryset=_scope_to_owner,
        on_create=_bind_avatar_owner,
    ),
    *register_attachment_endpoints(
        SingletonPdfAttachment,
        prefix="contract",
        singleton=True,
        permissions=[IsAuthenticated],
        queryset=_scope_pdf_to_owner,
        on_create=_bind_pdf_owner,
    ),
    *register_attachment_endpoints(
        MultiImageAttachment,
        prefix="images",
        permissions=[IsAuthenticated],
        queryset=_scope_image_to_owner,
        on_create=_bind_image_owner,
    ),
]
