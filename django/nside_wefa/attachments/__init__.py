"""Attachments app — abstract file-attachment model with versioning,
pluggable storage (django-storages), MIME sniffing (python-magic), hashing
and configurable per-subclass validation.

See ``README.md`` for usage and ``apps.AttachmentsConfig`` for the AppConfig.
"""

default_app_config = "nside_wefa.attachments.apps.AttachmentsConfig"
