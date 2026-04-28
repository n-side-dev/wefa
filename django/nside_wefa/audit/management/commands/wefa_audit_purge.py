"""``manage.py wefa_audit_purge`` — delete expired audit events."""

import datetime
from typing import Any

from auditlog import get_logentry_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from nside_wefa.audit.immutability import allow_purge
from nside_wefa.common.settings import get_section


class Command(BaseCommand):
    """Delete audit events older than ``--days`` (or ``RETENTION_DAYS`` setting)."""

    help = (
        "Delete audit events older than the configured retention. "
        "Either pass --days N or set NSIDE_WEFA.AUDIT.RETENTION_DAYS."
    )

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--days",
            type=int,
            default=None,
            help="Delete events older than this many days. "
            "Overrides NSIDE_WEFA.AUDIT.RETENTION_DAYS for this run.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print how many events would be deleted without deleting them.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        days = options["days"]
        if days is None:
            days = get_section("AUDIT", default={}).get("RETENTION_DAYS")
        if days is None:
            raise CommandError(
                "No retention configured. Pass --days N or set "
                "NSIDE_WEFA.AUDIT.RETENTION_DAYS."
            )
        if days <= 0:
            raise CommandError("--days must be a positive integer.")

        cutoff = timezone.now() - datetime.timedelta(days=days)
        model = get_logentry_model()
        queryset = model.objects.filter(timestamp__lt=cutoff)
        count = queryset.count()

        if options["dry_run"]:
            self.stdout.write(
                self.style.NOTICE(
                    f"Dry run: would delete {count} audit event(s) older than "
                    f"{cutoff.isoformat()}."
                )
            )
            return

        with allow_purge():
            queryset.delete()
        self.stdout.write(
            self.style.SUCCESS(
                f"Deleted {count} audit event(s) older than {cutoff.isoformat()}."
            )
        )
