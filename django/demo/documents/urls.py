"""Demo: wiring HTTP endpoints for versioned documents.

This is the **multi-mode** counterpart to the avatar URLs. The crucial
differences:

- POST on the collection URL creates a **new logical document** (v1
  with a fresh ``attachment_uid``). Two POSTs back-to-back produce two
  independent documents, not v1+v2 of the same one.
- POST on ``/<id>/versions/`` is the verb that bumps a specific
  document's version. The pk on the URL is the anchor; the new row
  shares its ``attachment_uid``.

The ``queryset`` callable below is the single most important line for
authorisation: every endpoint built by ``register_attachment_endpoints``
runs its query through it before doing anything else, so a row outside
the queryset is invisible to the caller — including the bump-version
path.
"""

from rest_framework.permissions import IsAuthenticated

from nside_wefa.attachments.serializers import build_attachment_serializer
from nside_wefa.attachments.urls import register_attachment_endpoints

from .models import Document


def _document_queryset(request, **url_kwargs):
    # Scope every endpoint to documents owned by the requesting user.
    # The library handles the "is_current" filtering internally where it
    # makes sense (e.g. the list endpoint), so we don't filter by it
    # here — the version-history endpoint needs the prior rows.
    return Document.objects.filter(owner=request.user)


def _bind_document_owner(request, instance, **url_kwargs):
    # Set the owning FK on the new document just before ingest. This
    # only fires on POST; the bump-version path inherits FKs from the
    # parent row automatically (see Attachment.add_version).
    instance.owner = request.user


# Build the serializer once so we can list ``title`` as a read-only
# field. The default serializer would still work — this is here to
# show the ``extra_read_only`` / ``extra_writable`` extension points.
DocumentSerializer = build_attachment_serializer(
    Document,
    extra_read_only=("title",),
)


urlpatterns = [
    *register_attachment_endpoints(
        Document,
        prefix="documents",
        # Multi-mode: many logical documents per user, each with its own
        # version chain. POST creates new; POST <pk>/versions/ bumps.
        singleton=False,
        permissions=[IsAuthenticated],
        queryset=_document_queryset,
        on_create=_bind_document_owner,
        serializer_class=DocumentSerializer,
    ),
]
