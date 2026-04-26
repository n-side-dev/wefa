"""``manage.py wefa_audit_verify`` — walk the tamper-evident hash chain."""

import sys
from typing import Any

from django.core.management.base import BaseCommand, CommandError

from nside_wefa.audit.models import WefaLogEntry, ZERO_HASH, compute_event_hash
from nside_wefa.common.settings import get_section


class Command(BaseCommand):
    """Verify the integrity of the tamper-evident hash chain."""

    help = (
        "Walk the WefaLogEntry table forward, recomputing each hash. "
        "Exit non-zero on the first divergence."
    )

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--from",
            dest="from_id",
            type=int,
            default=None,
            help="Start verification at this WefaLogEntry id (inclusive).",
        )
        parser.add_argument(
            "--to",
            dest="to_id",
            type=int,
            default=None,
            help="Stop verification at this WefaLogEntry id (inclusive).",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        if not get_section("AUDIT", default={}).get("TAMPER_EVIDENT"):
            raise CommandError(
                "Tamper-evidence is disabled. "
                "Set NSIDE_WEFA.AUDIT.TAMPER_EVIDENT = True to use this command."
            )

        queryset = WefaLogEntry.objects.order_by("id")
        if options["from_id"] is not None:
            queryset = queryset.filter(id__gte=options["from_id"])
        if options["to_id"] is not None:
            queryset = queryset.filter(id__lte=options["to_id"])

        prev_hash = ZERO_HASH
        if options["from_id"] is not None:
            preceding = (
                WefaLogEntry.objects.filter(id__lt=options["from_id"])
                .order_by("-id")
                .values("hash")
                .first()
            )
            if preceding is not None:
                prev_hash = preceding["hash"] or ZERO_HASH

        checked = 0
        for entry in queryset.iterator():
            expected = compute_event_hash(entry, prev_hash)
            if entry.prev_hash != prev_hash:
                self.stderr.write(
                    self.style.ERROR(
                        f"prev_hash mismatch at id={entry.id}: "
                        f"stored={entry.prev_hash!r}, expected={prev_hash!r}."
                    )
                )
                sys.exit(1)
            if entry.hash != expected:
                self.stderr.write(
                    self.style.ERROR(
                        f"hash mismatch at id={entry.id}: "
                        f"stored={entry.hash!r}, expected={expected!r}."
                    )
                )
                sys.exit(1)
            prev_hash = entry.hash
            checked += 1

        self.stdout.write(
            self.style.SUCCESS(f"Verified {checked} WefaLogEntry row(s). Chain intact.")
        )
