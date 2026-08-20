"""Serializer factory for concrete :class:`Attachment` subclasses.

Consumer apps rarely need to write a serializer by hand —
:func:`build_attachment_serializer` produces a ``ModelSerializer`` that
exposes the safe, server-controlled fields and accepts only ``file`` (and
any subclass FK fields the consumer chooses to add) on input.
"""

from __future__ import annotations

from typing import Iterable, Type

from drf_spectacular.utils import extend_schema_serializer
from rest_framework import serializers

from .models import Attachment


# Fields that are always exposed on read; never accepted on write.
READ_ONLY_FIELDS: tuple[str, ...] = (
    "id",
    "attachment_uid",
    "version",
    "is_current",
    "filename",
    "content_type",
    "byte_size",
    "file_hash",
    "hash_algorithm",
    "uploaded_by",
    "created_at",
    "updated_at",
)


def build_attachment_serializer(
    model_class: Type[Attachment],
    *,
    extra_read_only: Iterable[str] = (),
    extra_writable: Iterable[str] = (),
) -> Type[serializers.ModelSerializer]:
    """Return a ``ModelSerializer`` class scoped to ``model_class``.

    :param extra_read_only: Names of subclass-specific fields to expose
        read-only (e.g. a ``contract_id`` FK).
    :param extra_writable: Names of subclass-specific fields to accept on
        input (e.g. a description column the consumer wants editable).
    """
    extra_read_only_tuple = tuple(extra_read_only)
    extra_writable_tuple = tuple(extra_writable)

    fields_list = list(
        dict.fromkeys(
            READ_ONLY_FIELDS + ("file",) + extra_read_only_tuple + extra_writable_tuple
        )
    )
    read_only_list = list(dict.fromkeys(READ_ONLY_FIELDS + extra_read_only_tuple))

    Meta = type(
        "Meta",
        (),
        {
            "model": model_class,
            "fields": fields_list,
            "read_only_fields": read_only_list,
            "extra_kwargs": {
                "file": {
                    "write_only": True,
                    "help_text": (
                        "Binary upload. Sniffed by python-magic; the client "
                        "Content-Type header is ignored."
                    ),
                },
            },
        },
    )

    serializer_cls = type(
        f"{model_class.__name__}Serializer",
        (serializers.ModelSerializer,),
        {"Meta": Meta},
    )
    return extend_schema_serializer(component_name=model_class.__name__)(serializer_cls)
