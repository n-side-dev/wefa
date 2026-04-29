# WeFa Attachments App

An installable Django app that provides a reusable, abstract
`Attachment` base model with pluggable storage (S3, local, SFTP, FTP, …),
versioning, content-type sniffing, hashing, and a generic CRUD endpoint
factory.

## Overview

Consumer apps subclass `nside_wefa.attachments.models.Attachment` to add
file-attachment semantics to their own concrete tables. The base class
takes care of:

- **Storage** via [`django-storages`](https://django-storages.readthedocs.io/) and Django 5+ `STORAGES`. Pick a backend per-subclass with a `storage_alias` class attribute.
- **MIME sniffing** with [`python-magic`](https://github.com/ahupp/python-magic). The client `Content-Type` header is logged but never trusted.
- **Whitelist-only validation.** Every subclass MUST declare
  `allowed_content_types`. Unknown MIMEs are refused; there is no
  blacklist.
- **Streaming size enforcement and content hashing.** Size is checked
  both eagerly (declared size) and during streaming (running counter), so
  a hostile client lying about size still hits a ceiling.
- **Versioning** with `versioning_enabled = True` (default): every new
  upload creates a new row with `version + 1` and prior rows are flipped
  to `is_current = False`. Set `versioning_enabled = False` to get
  replace-in-place semantics for cases like avatars.
- **Generic CRUD endpoints.** `register_attachment_endpoints(...)`
  returns URL patterns scoped to a concrete subclass, in either
  *singleton* (one logical attachment per scope) or *multi* (many)
  shape.

## Installation

1. Install the package — `django-storages` and `python-magic` are
   pulled in automatically. `python-magic` requires `libmagic` on the
   host (`brew install libmagic` on macOS, already present in the
   standard CI image).
2. Add to `INSTALLED_APPS` (order matters — `nside_wefa.common` must
   precede `nside_wefa.attachments`):

   ```python
   INSTALLED_APPS = [
       # …
       "nside_wefa.common",
       "nside_wefa.attachments",
   ]
   ```

3. Configure `STORAGES` and `NSIDE_WEFA.ATTACHMENTS`:

   ```python
   STORAGES = {
       "default": {
           "BACKEND": "django.core.files.storage.FileSystemStorage",
       },
       # Optional — register additional aliases for S3, SFTP, etc.
   }

   NSIDE_WEFA = {
       "ATTACHMENTS": {
           # All keys optional; defaults shown.
           "STORAGE": "default",
           "MAX_FILE_SIZE": 10 * 1024 * 1024,
           "UPLOAD_PATH_PREFIX": "attachments/",
           "HASH_ALGORITHM": "sha256",
           "CONTENT_TYPE_SNIFF_BYTES": 2048,
       },
   }
   ```

   For non-default backends (S3, Azure, GCS, SFTP, FTP, Dropbox, …), see
   the [django-storages documentation](https://django-storages.readthedocs.io/en/latest/)
   — every backend it ships is usable here by registering it as an alias
   under Django's [`STORAGES`](https://docs.djangoproject.com/en/stable/ref/settings/#storages)
   setting and pointing `NSIDE_WEFA.ATTACHMENTS.STORAGE` (or a
   subclass's `storage_alias`) at it. The
   [backends overview](https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html)
   has copy-pasteable settings examples for the most common deployments.

   No migrations from this app — the model is abstract.

## Defining a concrete attachment

```python
from django.conf import settings
from django.db import models
from nside_wefa.attachments.models import Attachment


class ContractAttachment(Attachment):
    # Required — whitelist of accepted MIME types (sniffed from bytes).
    allowed_content_types = ["application/pdf"]

    # Optional knobs:
    versioning_enabled = True            # default
    max_size = 25 * 1024 * 1024           # bytes; falls back to NSIDE_WEFA.ATTACHMENTS.MAX_FILE_SIZE
    storage_alias = None                  # falls back to NSIDE_WEFA.ATTACHMENTS.STORAGE
    upload_path_prefix = "contracts/"     # falls back to UPLOAD_PATH_PREFIX

    contract = models.ForeignKey("contracts.Contract", on_delete=models.CASCADE,
                                 related_name="attachments")
```

Run `makemigrations` / `migrate` for **your** app — the abstract base
contributes its columns to the concrete table.

## Wiring HTTP endpoints

### Singleton mode (avatar, contract PDF)

```python
# myapp/urls.py
from rest_framework.permissions import IsAuthenticated
from nside_wefa.attachments.urls import register_attachment_endpoints
from .models import ContractAttachment

urlpatterns = [
    *register_attachment_endpoints(
        ContractAttachment,
        prefix="contracts/<int:contract_id>/attachment",
        singleton=True,
        permissions=[IsAuthenticated],
        queryset=lambda request, **kw: ContractAttachment.objects.filter(
            contract_id=kw["contract_id"], contract__user=request.user,
        ),
        on_create=lambda request, instance, **kw: setattr(
            instance, "contract_id", kw["contract_id"]
        ),
    ),
]
```

| Method | URL | Behavior |
|---|---|---|
| `GET` | `/contracts/42/attachment/` | Current version, or 404. |
| `POST` | `/contracts/42/attachment/` | First call → v1; subsequent calls → v+1 (or replace in place when `versioning_enabled=False`). |
| `GET` | `/contracts/42/attachment/versions/` | Full history (omitted when `versioning_enabled=False`). |
| `GET` | `/contracts/42/attachment/versions/<n>/` | Specific historical version. |
| `GET` | `/contracts/42/attachment/download/` | Stream current bytes. |
| `DELETE` | `/contracts/42/attachment/` | Delete all versions and blobs. |

### Multi mode (issue with many attachments)

```python
*register_attachment_endpoints(
    IssueAttachment,
    prefix="issues/<int:issue_id>/attachments",
    permissions=[IsAuthenticated],
    queryset=lambda request, **kw: IssueAttachment.objects.filter(
        issue_id=kw["issue_id"]
    ),
    on_create=lambda request, instance, **kw: setattr(
        instance, "issue_id", kw["issue_id"]
    ),
),
```

| Method | URL | Behavior |
|---|---|---|
| `GET` | `/issues/7/attachments/` | List of current versions. |
| `POST` | `/issues/7/attachments/` | Create a new logical attachment (v1). |
| `GET` | `/issues/7/attachments/<id>/` | Retrieve a specific row. |
| `POST` | `/issues/7/attachments/<id>/versions/` | Bump that logical attachment. |
| `GET` | `/issues/7/attachments/<id>/versions/` | History for that uid. |
| `GET` | `/issues/7/attachments/<id>/download/` | Stream that row. |
| `DELETE` | `/issues/7/attachments/<id>/` | Hard-delete the entire logical attachment. |

## Programmatic API

```python
# Create v1
ContractAttachment.upload(file=request.FILES["file"], contract=contract)

# Bump to v2 (versioning_enabled=True)
ContractAttachment.add_version(file=request.FILES["file"], parent=current_row)

# Replace in place (versioning_enabled=False)
existing.replace_in_place(file=request.FILES["file"])

# Manager helpers
contract.attachments.current().get()
contract.attachments.history(uid)

# Hard delete with blob
existing.hard_delete_with_blob()
ContractAttachment.hard_delete_logical(uid)
```

## Security notes

- Content-type sniffing always wins over the client header.
- The whitelist (`allowed_content_types`) is exact-match; wildcards
  (`image/*`) are not supported in v1 to keep policies auditable.
- `MAX_FILE_SIZE` is enforced both eagerly and as a streaming counter.
- Filenames are sanitised (path separators, control chars, NUL stripped;
  Unicode normalised; trimmed to 200 chars). The storage path is
  `{prefix}/{attachment_uid}/{version}/{sanitised_filename}` so user
  input never controls anything beyond the trailing component.
- Versioning and singleton-POST run inside `transaction.atomic()` with
  `select_for_update()` over the scoped queryset, so concurrent uploads
  serialise.
- Hard deletes remove both the database row and the underlying blob.

## Settings reference

| Key | Type | Default | Notes |
|---|---|---|---|
| `STORAGE` | `str` | `"default"` | Alias into `settings.STORAGES`. |
| `MAX_FILE_SIZE` | `int \| None` | `10485760` | Default cap; subclasses may override via `max_size`. |
| `UPLOAD_PATH_PREFIX` | `str` | `"attachments/"` | Prepended to the storage key. |
| `HASH_ALGORITHM` | `str` | `"sha256"` | Must be in `hashlib.algorithms_guaranteed`. |
| `CONTENT_TYPE_SNIFF_BYTES` | `int` | `2048` | Bytes read by libmagic. |
