"""``manage.py wefa_audit_export`` — emit a single user's audit history.

Designed to feed the future GDPR personal-data export pipeline (catalog A6).
Outputs to stdout so it can be piped, redirected, or captured by a Celery
worker.
"""

import csv
import json
from typing import Any, Iterable

from auditlog import get_logentry_model
from auditlog.models import AbstractLogEntry
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    """Export a single user's audit events as JSON or CSV."""

    help = (
        "Export every audit event whose actor is the given user, as JSON "
        "(default) or CSV. Output goes to stdout."
    )

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--user",
            type=int,
            required=True,
            help="Primary key of the user whose events to export.",
        )
        parser.add_argument(
            "--format",
            choices=("json", "csv"),
            default="json",
            help="Output format. Default: json.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        user_pk = options["user"]
        format_ = options["format"]

        user_model = get_user_model()
        try:
            user = user_model.objects.get(pk=user_pk)
        except user_model.DoesNotExist as exc:
            raise CommandError(f"No user with pk={user_pk}.") from exc

        model = get_logentry_model()
        events = model.objects.filter(actor=user).order_by("timestamp", "id")

        if format_ == "json":
            json.dump(
                [_serialize(e) for e in events],
                self.stdout,
                default=str,
                indent=2,
                sort_keys=True,
            )
            self.stdout.write("\n")
        else:
            _write_csv(events, self.stdout)


def _serialize(entry: AbstractLogEntry) -> dict:
    additional = entry.additional_data or {}
    return {
        "id": entry.pk,
        "timestamp": entry.timestamp.isoformat() if entry.timestamp else None,
        "action": additional.get("action") or entry.get_action_display(),
        "outcome": additional.get("outcome") or "success",
        "target_repr": entry.object_repr,
        "target_pk": entry.object_pk,
        "changes": entry.changes,
        "metadata": additional.get("metadata", {}),
        "remote_addr": str(entry.remote_addr) if entry.remote_addr else None,
        "cid": entry.cid,
    }


def _write_csv(events: Iterable[AbstractLogEntry], out: Any) -> None:
    fieldnames = [
        "id",
        "timestamp",
        "action",
        "outcome",
        "target_repr",
        "target_pk",
        "changes",
        "metadata",
        "remote_addr",
        "cid",
    ]
    writer = csv.DictWriter(out, fieldnames=fieldnames)
    writer.writeheader()
    for entry in events:
        row = _serialize(entry)
        # CSV fields can't hold dicts: stringify the JSON-shaped columns.
        row["changes"] = json.dumps(row["changes"], default=str, sort_keys=True)
        row["metadata"] = json.dumps(row["metadata"], default=str, sort_keys=True)
        writer.writerow(row)
