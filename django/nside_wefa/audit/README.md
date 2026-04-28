# WeFa Audit App

A Django app that provides a single, opinionated audit log on top of
[django-auditlog](https://github.com/jazzband/django-auditlog), plus the
WeFa-specific layers most products need: REST endpoints, cross-app event
sources for the rest of the toolkit, optional tamper-evident hash chain,
retention purge, and personal-data export.

## Overview

The app stores every audit event in auditlog's generic `LogEntry` table
(action, actor, content_type, object_pk, changes, additional_data, etc.)
and adds:

- **A unified registration UX** with four ergonomic ways to opt a model in.
- **Read-only REST endpoints**: staff sees everything, the authenticated user
  sees their own events.
- **Built-in event sources** for `auth`, `legal_consent`, and `locale`.
- **Optional tamper-evident hash chain** via the `WefaLogEntry` subclass.
- **Append-only enforcement** at the model layer.
- **Retention, integrity verification, and GDPR export** management commands.

## Installation

1. Install the package (the `django-auditlog` dependency is pulled in
   automatically).

2. Add to `INSTALLED_APPS` (order matters — `nside_wefa.common` and
   `auditlog` must each precede `nside_wefa.audit`):

   ```python
   INSTALLED_APPS = [
       # ... Django core, DRF, etc.
       "auditlog",
       "nside_wefa.common",
       "nside_wefa.audit",
   ]
   ```

3. Add auditlog's middleware so the actor and remote address are captured
   per request:

   ```python
   MIDDLEWARE = [
       # ... your other middleware ...
       "django.contrib.auth.middleware.AuthenticationMiddleware",
       "auditlog.middleware.AuditlogMiddleware",
   ]
   ```

4. Run migrations:

   ```bash
   python manage.py migrate
   ```

5. Include the URLs in your project's `urls.py`:

   ```python
   urlpatterns = [
       # ...
       path("audit/", include("nside_wefa.audit.urls")),
   ]
   ```

## Registering models for auditing

Four ways to opt a model in. They all delegate to the same underlying
`auditlog.register()` call, so they compose freely.

### Path A — module-level `register()`

The recommended primary path. Call at the bottom of `models.py`:

```python
from django.db import models
from nside_wefa.audit import register

class Order(models.Model):
    status = models.CharField(max_length=32)
    total  = models.DecimalField(max_digits=10, decimal_places=2)
    secret_token = models.CharField(max_length=64)

register(
    Order,
    include_fields=["status", "total"],
    mask_fields=["secret_token"],
)
```

### Path B — `@audited` decorator

```python
from nside_wefa.audit import audited

@audited(include_fields=["status", "total"])
class Order(models.Model):
    status = models.CharField(max_length=32)
    total  = models.DecimalField(max_digits=10, decimal_places=2)
```

### Path C — `AuditAppConfigMixin`

Keep models clean by declaring registrations on your `AppConfig`:

```python
from django.apps import AppConfig
from nside_wefa.audit import AuditAppConfigMixin

class OrdersConfig(AuditAppConfigMixin, AppConfig):
    name = "orders"
    audited_models = {
        "Order":    {"include_fields": ["status", "total"]},
        "Customer": {"exclude_fields": ["last_login_ip"]},
    }
```

### Path D — settings-only

For third-party models you cannot edit. Each label is validated at startup
so a typo fails the boot loudly (a strict win over auditlog's silent skip):

```python
NSIDE_WEFA = {
    "AUDIT": {
        "MODELS": {
            "wagtail.Page": {"include_fields": ["title", "live"]},
        },
    },
}
```

For spike or staging environments only:

```python
NSIDE_WEFA = {"AUDIT": {"INCLUDE_ALL_MODELS": True}}
```

## Logging events explicitly

For events that aren't tied to a model save (login attempts, business
actions, permission denials):

```python
from nside_wefa import audit

audit.log(
    "order.cancel",
    actor=request.user,
    target=order,
    changes={"status": {"from": "open", "to": "cancelled"}},
    metadata={"reason": "customer_request"},
    outcome=audit.Outcome.SUCCESS,
)
```

`actor` defaults to whatever `AuditlogMiddleware` / `audit.set_actor()` has
in scope. Pass `actor=None` explicitly to mark a system or anonymous event.

For Celery / async contexts:

```python
from nside_wefa.audit import set_actor

with set_actor(user):
    do_long_running_thing()
```

## REST endpoints

Mounted under whatever prefix you include `nside_wefa.audit.urls` at:

| Method | Path                              | Auth          | Description                                           |
| ------ | --------------------------------- | ------------- | ----------------------------------------------------- |
| GET    | `/audit/events/`                  | Staff         | List every audit event. Filterable.                   |
| GET    | `/audit/events/<id>/`             | Staff         | Single event. Includes hash chain when tamper-evident.|
| GET    | `/audit/me/`                      | Authenticated | List the current user's audit events.                 |

Filters supported on both list endpoints: `action`, `action__startswith`,
`outcome`, `cid`, `target_type` (`app_label.model_name`), `target_id`,
`timestamp__gte`, `timestamp__lte`. The staff endpoint additionally
accepts `actor` (user pk).

## Settings reference (`NSIDE_WEFA.AUDIT`)

Every key is optional; defaults below.

| Key                    | Default                                       | Purpose                                                   |
| ---------------------- | --------------------------------------------- | --------------------------------------------------------- |
| `MODELS`               | `{}`                                          | Path D: third-party models to register.                   |
| `INCLUDE_ALL_MODELS`   | `False`                                       | Track every concrete model. Spike/staging only.           |
| `EXCLUDE_MODELS`       | `[]`                                          | Labels excluded from `INCLUDE_ALL_MODELS`.                |
| `REDACT_FIELDS`        | `["password","token","authorization","secret","api_key"]` | Field names whose values are masked in `changes` and `metadata`. |
| `DISABLE_REMOTE_ADDR`  | `False`                                       | Skip IP capture in the middleware.                        |
| `REQUEST_ID_HEADER`    | `"X-Request-ID"` (auditlog default)           | Correlation header read by the middleware.                |
| `TAMPER_EVIDENT`       | `False`                                       | Use `WefaLogEntry` with SHA-256 hash chain.               |
| `RETENTION_DAYS`       | `None` (forever)                              | Default age cutoff used by `wefa_audit_purge`.            |
| `BUILTIN_SOURCES`      | `["auth","legal_consent","locale"]`           | Which other-WeFa-app event sources to wire.               |
| `RAISE_ON_FAILURE`     | `False`                                       | When True, write failures raise `AuditWriteError`. When False (default), warn-and-continue via the `nside_wefa.audit` logger. |
| `ACTOR_RESOLVER`       | auditlog default                              | Dotted path to a callable resolving the request actor.    |

All keys are validated at startup via Django system checks. Run
`python manage.py check` to surface mistakes early.

## Tamper-evident mode

Set `NSIDE_WEFA.AUDIT.TAMPER_EVIDENT = True` to swap auditlog's `LogEntry`
for the `WefaLogEntry` subclass. Each new event includes:

- `prev_hash`: SHA-256 hex of the previous event's `hash` (zeroes for the
  first row).
- `hash`: SHA-256 hex of the canonical serialization of this event +
  `prev_hash`.

A `pre_save` handler computes both inside a row-level lock. To verify:

```bash
python manage.py wefa_audit_verify                    # walk the whole chain
python manage.py wefa_audit_verify --from 1000 --to 2000
python manage.py wefa_audit_verify --strict-head      # also require the chain origin to still be present
```

Non-zero exit on the first divergence, with the offending id reported.

**Verification is purge-aware.** `wefa_audit_verify` checks two things on
every row — that the row's own `hash` matches its content (self-consistency)
and that its `prev_hash` matches the previous row's `hash` (chain link). The
first row in the verification window is treated as an *anchor*: its stored
`prev_hash` is trusted as-is, but its own hash is still verified. This means
verification stays useful after `wefa_audit_purge` deletes old rows — the
new earliest row simply becomes the anchor. Pass `--strict-head` to opt out
and require the absolute chain origin (a row whose `prev_hash` is the
all-zeros sentinel) to still be present.

For regulated deployments, also run `REVOKE UPDATE, DELETE` on the table at
the database level — the model-layer guard catches application bugs but a
DBA-side revoke is the only protection against direct SQL access.

## Append-only enforcement

`pre_save` and `pre_delete` handlers raise `AuditEventImmutableError` on any
attempt to mutate or delete an existing event. The `wefa_audit_purge`
command uses an internal context manager (`allow_purge()`) to bypass the
guard — if you ever build other tooling that legitimately needs to delete
rows, use the same context manager.

## Built-in event sources

When the corresponding source app is in `INSTALLED_APPS`, the audit app
emits these events automatically:

| Source         | Events                                                                                  |
| -------------- | --------------------------------------------------------------------------------------- |
| `auth`         | `auth.login`, `auth.login_failed` (`outcome=failure`), `auth.logout`                    |
| `legal_consent`| `legal_consent.renew`                                                                   |
| `locale`       | `locale.change`                                                                         |

Disable any by listing only the ones you want:

```python
NSIDE_WEFA = {"AUDIT": {"BUILTIN_SOURCES": ["auth"]}}
```

## Management commands

```bash
# Delete events older than N days (or NSIDE_WEFA.AUDIT.RETENTION_DAYS).
python manage.py wefa_audit_purge --days 90
python manage.py wefa_audit_purge --days 90 --dry-run

# Verify the tamper-evident hash chain.
python manage.py wefa_audit_verify

# Export a single user's audit events as JSON or CSV.
# Designed to feed the future GDPR personal-data export pipeline.
python manage.py wefa_audit_export --user 42 --format json > alice.json
python manage.py wefa_audit_export --user 42 --format csv  > alice.csv
```

## Failure handling

`audit.log()` and the auto-tracked saves share one failure-handling
contract:

- **Default (`RAISE_ON_FAILURE=False`)**: write errors are caught, a warning
  is logged on the `nside_wefa.audit` logger, and `audit.log()` returns
  `None`. The surrounding view / transaction keeps running.
- **`RAISE_ON_FAILURE=True`**: the original exception is re-raised wrapped
  in `AuditWriteError`. Recommended for tests and CI.

## Admin

The app registers a read-only admin for `LogEntry` (replaces auditlog's own
admin). Add / change / delete are all denied; the list view shows the
WeFa-style `action` and `outcome`.
