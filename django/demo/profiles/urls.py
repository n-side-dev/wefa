"""Demo: wiring HTTP endpoints for the avatar.

``register_attachment_endpoints`` returns a list of URL patterns. Splat
the result into ``urlpatterns`` to mount it at the include() prefix.

The two callables below are the standard pattern for scoping a
singleton attachment to the requesting user:

- ``queryset`` returns the rows visible to the caller. Anything outside
  the queryset is invisible to GET / POST / DELETE — a clean,
  declarative authorisation boundary that doesn't require writing custom
  views.
- ``on_create`` runs before the file ingest pipeline so you can attach
  any owning FKs to the new instance. The ingest pipeline itself
  (sniffing, hashing, validation, save) is handled by the library.
"""

from rest_framework.permissions import IsAuthenticated

from nside_wefa.attachments.urls import register_attachment_endpoints

from .models import Avatar


def _avatar_queryset(request, **url_kwargs):
    # The caller can only ever see their own avatar — there is no
    # "list every avatar" endpoint exposed.
    return Avatar.objects.filter(user=request.user)


def _bind_avatar_user(request, instance, **url_kwargs):
    # Called once per POST, before the file is ingested. Set any
    # subclass FKs on the instance here.
    instance.user = request.user


urlpatterns = [
    *register_attachment_endpoints(
        Avatar,
        prefix="me/avatar",
        # Singleton mode: one Avatar per scope (here, per user). POST on
        # the collection URL creates the row or replaces it in place.
        # The ``<id>`` segment is omitted from every URL.
        singleton=True,
        permissions=[IsAuthenticated],
        queryset=_avatar_queryset,
        on_create=_bind_avatar_user,
    ),
]
