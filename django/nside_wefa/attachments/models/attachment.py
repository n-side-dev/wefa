"""Abstract :class:`Attachment` base model.

Concrete subclasses gain:

- A versioned blob anchored by ``attachment_uid``.
- python-magic content-type sniffing on every save.
- Whitelist-only content-type validation (``allowed_content_types``).
- Streaming size enforcement and content hashing.
- Pluggable storage via ``storage_alias``.

See ``nside_wefa/attachments/README.md`` for usage.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Optional, Type
from uuid import UUID

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured, ValidationError
from django.core.files.base import File
from django.core.files.uploadedfile import UploadedFile
from django.db import models, transaction

from ..settings import AttachmentsSettings
from ..storage import get_attachment_storage
from ..validators import (
    compute_file_hash,
    sanitise_filename,
    sniff_content_type,
    validate_content_type,
    validate_size,
)

logger = logging.getLogger("nside_wefa.attachments")


def _resolve_storage_for(model_class: Type["Attachment"]):
    """Return a callable suitable for ``FileField(storage=...)``.

    Resolves at call time so subclasses overriding ``storage_alias`` are
    honoured. Django invokes the callable each time it needs the storage,
    so the resolution stays lazy and respects settings overrides in tests.
    """

    def _factory():
        alias = getattr(model_class, "storage_alias", None)
        return get_attachment_storage(alias)

    return _factory


def _concrete_fk_values(instance: "Attachment") -> dict[str, Any]:
    """Return non-Attachment FK column values from ``instance``.

    Used when bumping a version so the new row carries the same owning
    FK(s) as the prior row (e.g. ``contract_id``). ``uploaded_by`` is
    excluded — that is set by the caller for the new revision.
    """
    from django.db.models import ForeignKey

    out: dict[str, Any] = {}
    for field in instance._meta.get_fields():
        if not isinstance(field, ForeignKey):
            continue
        if field.name == "uploaded_by":
            continue
        attname = field.attname  # e.g. "contract_id"
        value = getattr(instance, attname, None)
        if value is not None:
            out[attname] = value
    return out


def _attachment_upload_to(instance: "Attachment", filename: str) -> str:
    """Compute the storage key for an attachment.

    The path is ``{prefix}{uid}/{version}/{sanitised_filename}``. Both the
    uid and version come from server-side state, so a hostile client cannot
    influence the storage key beyond the trailing filename component.
    """
    cls = type(instance)
    settings_obj = AttachmentsSettings.load()
    prefix = getattr(cls, "upload_path_prefix", None) or settings_obj.upload_path_prefix
    if prefix and not prefix.endswith("/"):
        prefix = prefix + "/"
    safe_name = sanitise_filename(filename)
    return f"{prefix}{instance.attachment_uid}/{instance.version}/{safe_name}"


class AttachmentManager(models.Manager):
    """Manager exposing the version-aware query helpers.

    ``current()`` filters to the latest row per logical attachment;
    ``history(uid)`` returns every revision for a given uid in chronological
    order.
    """

    def current(self) -> models.QuerySet:
        return self.filter(is_current=True)

    def history(self, attachment_uid: UUID) -> models.QuerySet:
        return self.filter(attachment_uid=attachment_uid).order_by("version")


class Attachment(models.Model):
    """Abstract attachment record.

    Subclasses MUST declare :attr:`allowed_content_types` (a non-empty list
    of MIME strings). They MAY override:

    - :attr:`versioning_enabled` (default ``True``)
    - :attr:`max_size` (bytes; falls back to ``NSIDE_WEFA.ATTACHMENTS.MAX_FILE_SIZE``)
    - :attr:`storage_alias` (key into ``settings.STORAGES``)
    - :attr:`upload_path_prefix` (prepended to the storage key)
    """

    # --- Subclass configuration knobs (override as class attributes) ---

    #: Whether re-uploads create a new versioned row (True) or replace the
    #: existing row in place (False). When False, ``add_version()`` raises
    #: and ``replace_in_place()`` is the supported re-upload path.
    versioning_enabled: bool = True

    #: Whitelist of MIME strings accepted for this subclass. Required.
    allowed_content_types: list[str] = []

    #: Per-subclass max upload size in bytes. ``None`` (the default) defers
    #: to ``NSIDE_WEFA.ATTACHMENTS.MAX_FILE_SIZE``.
    max_size: Optional[int] = None

    #: Storage alias from ``settings.STORAGES``. ``None`` defers to
    #: ``NSIDE_WEFA.ATTACHMENTS.STORAGE``.
    storage_alias: Optional[str] = None

    #: Override of the global ``UPLOAD_PATH_PREFIX``. ``None`` defers.
    upload_path_prefix: Optional[str] = None

    # --- Persisted columns ---

    attachment_uid = models.UUIDField(
        default=uuid.uuid4,
        db_index=True,
        editable=False,
        help_text="Stable identifier shared across all versions of one logical attachment.",
    )
    version = models.PositiveIntegerField(
        default=1,
        help_text="Monotonically increasing revision counter within an attachment_uid.",
    )
    is_current = models.BooleanField(
        default=True,
        db_index=True,
        help_text="True for the most recent revision of this attachment_uid.",
    )
    file = models.FileField(
        storage=None,  # populated in __init_subclass__
        upload_to=_attachment_upload_to,
        max_length=512,
        help_text="The stored file blob.",
    )
    filename = models.CharField(
        max_length=255,
        help_text="Sanitised original filename, for display.",
    )
    content_type = models.CharField(
        max_length=128,
        help_text="MIME type as detected from the file bytes (not the client header).",
    )
    byte_size = models.PositiveBigIntegerField(
        help_text="Verified size in bytes after streaming.",
    )
    file_hash = models.CharField(
        max_length=128,
        db_index=True,
        help_text="Hex digest computed by streaming the file through `hash_algorithm`.",
    )
    hash_algorithm = models.CharField(
        max_length=32,
        default="sha256",
        help_text="Algorithm used for `file_hash`.",
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        help_text="The user who performed the upload, when known.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = AttachmentManager()

    class Meta:
        abstract = True
        ordering = ["-created_at", "-id"]

    def __init_subclass__(cls, **kwargs: Any) -> None:
        super().__init_subclass__(**kwargs)
        if cls._meta.abstract:
            return
        # Bind the FileField storage to the subclass at class-creation time
        # so subclass-level ``storage_alias`` overrides are picked up.
        try:
            file_field = cls._meta.get_field("file")
        except Exception:  # pragma: no cover - defensive, shouldn't happen
            return
        if isinstance(file_field, models.FileField):
            file_field.storage = get_attachment_storage(
                getattr(cls, "storage_alias", None)
            )

    # --- Validation helpers ---

    @classmethod
    def _check_subclass_configuration(cls) -> None:
        """Enforce that the subclass has declared the required knobs.

        Called from ``clean()``, ``add_version()``, ``replace_in_place()``,
        and the registration factory so the failure mode is consistent
        regardless of how the subclass is exercised.
        """
        if (
            not isinstance(cls.allowed_content_types, list)
            or not cls.allowed_content_types
        ):
            raise ImproperlyConfigured(
                f"{cls.__module__}.{cls.__name__} must declare a non-empty "
                "`allowed_content_types` list. Whitelist-only content-type "
                "validation is mandatory."
            )
        if cls.max_size is None and AttachmentsSettings.load().max_file_size is None:
            raise ImproperlyConfigured(
                f"{cls.__module__}.{cls.__name__} must declare `max_size` "
                "(class attribute) or set NSIDE_WEFA.ATTACHMENTS.MAX_FILE_SIZE."
            )

    @classmethod
    def effective_max_size(cls) -> int:
        cls._check_subclass_configuration()
        return cls.max_size or AttachmentsSettings.load().max_file_size  # type: ignore[return-value]

    # --- Public API ---

    @classmethod
    def upload(
        cls,
        *,
        file: UploadedFile | File,
        uploaded_by: Any | None = None,
        attachment_uid: UUID | None = None,
        parent: Optional["Attachment"] = None,
        **extra: Any,
    ) -> "Attachment":
        """Create the first version of a logical attachment.

        Use :meth:`add_version` to bump an existing logical attachment, or
        :meth:`replace_in_place` when ``versioning_enabled`` is False.

        ``extra`` is forwarded to the model constructor so subclass FKs
        (e.g. ``contract=...``) can be supplied here.
        """
        cls._check_subclass_configuration()
        if parent is not None:
            raise ValueError(
                "upload() creates a fresh logical attachment; pass `parent` to "
                "add_version() / replace_in_place() instead."
            )
        instance = cls(
            attachment_uid=attachment_uid or uuid.uuid4(),
            version=1,
            is_current=True,
            uploaded_by=uploaded_by,
            **extra,
        )
        instance._ingest_file(file)
        instance.save()
        return instance

    @classmethod
    def add_version(
        cls,
        *,
        file: UploadedFile | File,
        parent: Optional["Attachment"] = None,
        attachment_uid: UUID | None = None,
        uploaded_by: Any | None = None,
        **extra: Any,
    ) -> "Attachment":
        """Append a new revision and flip prior rows to ``is_current=False``.

        Either ``parent`` (an existing row) or ``attachment_uid`` must be
        supplied. The operation runs inside an atomic block with row-level
        locks so concurrent calls serialise.
        """
        cls._check_subclass_configuration()
        if not cls.versioning_enabled:
            raise NotImplementedError(
                f"{cls.__name__}.versioning_enabled is False — use replace_in_place()."
            )
        if parent is None and attachment_uid is None:
            raise ValueError(
                "add_version() requires either `parent` or `attachment_uid`."
            )
        uid = attachment_uid or parent.attachment_uid  # type: ignore[union-attr]

        with transaction.atomic():
            siblings = (
                cls.objects.select_for_update()
                .filter(attachment_uid=uid)
                .order_by("-version")
            )
            siblings_list = list(siblings)
            if not siblings_list:
                next_version = 1
                fk_inheritance: dict[str, Any] = {}
            else:
                next_version = siblings_list[0].version + 1
                # Inherit subclass FKs (e.g. ``owner_id``, ``contract_id``)
                # from the most recent sibling so the new row satisfies the
                # same constraints. Caller can override via ``extra``.
                fk_inheritance = _concrete_fk_values(siblings_list[0])
                # Flip every prior current row in this uid scope.
                cls.objects.filter(attachment_uid=uid, is_current=True).update(
                    is_current=False
                )
            merged = {**fk_inheritance, **extra}
            instance = cls(
                attachment_uid=uid,
                version=next_version,
                is_current=True,
                uploaded_by=uploaded_by,
                **merged,
            )
            instance._ingest_file(file)
            instance.save()
            return instance

    def replace_in_place(
        self,
        *,
        file: UploadedFile | File,
        uploaded_by: Any | None = None,
    ) -> "Attachment":
        """Overwrite this row's file/hash/content/size/timestamp atomically.

        Only valid when ``versioning_enabled`` is False. The previous blob
        is removed from storage on success.
        """
        cls = type(self)
        cls._check_subclass_configuration()
        if cls.versioning_enabled:
            raise NotImplementedError(
                f"{cls.__name__}.versioning_enabled is True — use add_version()."
            )
        old_storage_name = self.file.name if self.file else None
        with transaction.atomic():
            locked = cls.objects.select_for_update().get(pk=self.pk)
            self._ingest_file(file)
            if uploaded_by is not None:
                self.uploaded_by = uploaded_by
            self.save()
            # Unlink the old blob after a successful save. Do this last so
            # a failure earlier in the transaction leaves storage intact.
            if old_storage_name and old_storage_name != self.file.name:
                try:
                    locked.file.storage.delete(old_storage_name)
                except Exception:
                    logger.exception(
                        "Failed to delete previous attachment blob %s for %s pk=%s",
                        old_storage_name,
                        cls.__name__,
                        self.pk,
                    )
        return self

    def hard_delete_with_blob(self) -> None:
        """Delete this row and its underlying blob.

        Provided as an explicit method because Django's default ``delete()``
        does not remove the file from storage.
        """
        storage_name = self.file.name if self.file else None
        storage = self.file.storage if self.file else None
        super_delete = super().delete
        super_delete()
        if storage_name and storage is not None:
            try:
                storage.delete(storage_name)
            except Exception:
                logger.exception(
                    "Failed to delete attachment blob %s for pk=%s",
                    storage_name,
                    self.pk,
                )

    @classmethod
    def hard_delete_logical(cls, attachment_uid: UUID) -> int:
        """Delete every row sharing ``attachment_uid`` and their blobs.

        Returns the number of rows deleted.
        """
        with transaction.atomic():
            rows = list(
                cls.objects.select_for_update().filter(attachment_uid=attachment_uid)
            )
            for row in rows:
                row.hard_delete_with_blob()
            return len(rows)

    # --- Internal: validate, sniff, hash, sanitise ---

    def clean(self) -> None:
        super().clean()
        type(self)._check_subclass_configuration()

    def _ingest_file(self, file: UploadedFile | File) -> None:
        """Run the validation + sniff + hash pipeline and populate fields.

        After this call, ``self.file``, ``self.filename``, ``self.content_type``,
        ``self.byte_size``, and ``self.file_hash`` are set. Caller is
        responsible for ``save()``.
        """
        cls = type(self)
        cls._check_subclass_configuration()
        settings_obj = AttachmentsSettings.load()
        max_size = cls.effective_max_size()

        # Eager size check: trust the declared size as a fast first gate.
        declared_size = getattr(file, "size", None)
        if isinstance(declared_size, int):
            validate_size(declared_size, max_size)

        # Sniff MIME from the head of the stream. Both UploadedFile and File
        # support seek(); refuse the upload if the stream cannot be rewound,
        # since we'd otherwise hand a partially-consumed file to storage.
        try:
            file.seek(0)
        except (AttributeError, OSError) as exc:
            raise ValidationError(
                "Uploaded stream is not seekable; refusing the upload.",
                code="attachments_stream_not_seekable",
            ) from exc

        sniff = sniff_content_type(file, settings_obj.content_type_sniff_bytes)
        validate_content_type(sniff.content_type, cls.allowed_content_types)

        client_declared = getattr(file, "content_type", None)
        if client_declared and client_declared != sniff.content_type:
            logger.info(
                "Attachment client header '%s' disagrees with sniffed '%s' "
                "for %s; trusting sniffed value.",
                client_declared,
                sniff.content_type,
                cls.__name__,
            )

        # Streaming hash + authoritative size, with the running counter as a
        # second size gate.
        digest, byte_count = compute_file_hash(
            file,
            algorithm=settings_obj.hash_algorithm,
            max_size=max_size,
        )

        raw_filename = getattr(file, "name", "") or "file"
        safe_name = sanitise_filename(raw_filename)

        self.filename = safe_name
        self.content_type = sniff.content_type
        self.byte_size = byte_count
        self.file_hash = digest
        self.hash_algorithm = settings_obj.hash_algorithm
        # Re-attach the file handle (rewound by compute_file_hash). Django
        # will pass `file.name` to the upload_to callable on save, where
        # sanitise_filename runs again — so the storage key stays clean
        # regardless of what the client sent.
        self.file = file


__all__ = ["Attachment", "AttachmentManager"]
