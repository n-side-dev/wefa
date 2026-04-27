"""``manage.py wefa_audit_verify`` — walk the tamper-evident hash chain.

Verification has two layers:

- **Self-consistency**: every row must satisfy ``hash == sha256(content || prev_hash)``.
  Checked on every row, including the first one in the verification window.
- **Chain link**: each row's ``prev_hash`` must equal the previous row's ``hash``.
  Checked from the *second* row of the window onward.

The first row of the verification window is treated as an **anchor** — its
stored ``prev_hash`` is trusted as-is. This is what lets the command remain
useful after ``wefa_audit_purge`` deletes old rows: the new earliest row
will keep a non-zero ``prev_hash`` pointing at a row that no longer exists,
and we can no longer follow that link, but we can still detect any
post-anchor tampering.

If you need to assert that the original chain origin (a row whose
``prev_hash`` is the all-zeros sentinel) is still present, pass
``--strict-head``.
"""

import sys
from typing import Any

from django.core.management.base import BaseCommand, CommandError

from nside_wefa.audit.models import WefaLogEntry, ZERO_HASH, compute_event_hash
from nside_wefa.common.settings import get_section


class Command(BaseCommand):
    """Verify the integrity of the tamper-evident hash chain."""

    help = (
        "Walk the WefaLogEntry table forward, recomputing each row's hash and "
        "checking each chain link. Exit non-zero on the first divergence. "
        "Tolerates wefa_audit_purge: the earliest surviving row anchors the "
        "verification (use --strict-head to opt out)."
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
        parser.add_argument(
            "--strict-head",
            action="store_true",
            help=(
                "Require the first row in the verification window to be the "
                "absolute chain origin (prev_hash == ZERO). Use when you have "
                "not run wefa_audit_purge and want to confirm that the "
                "original chain head is still present."
            ),
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

        # Resolve the seed prev_hash for the chain-link check:
        # - if --from is supplied and the preceding row exists, use its hash;
        # - otherwise leave it unset and let the first row of the window act
        #   as the anchor (its stored prev_hash is trusted as-is, but its own
        #   hash is still verified).
        seed_prev_hash: str | None = None
        if options["from_id"] is not None:
            preceding = (
                WefaLogEntry.objects.filter(id__lt=options["from_id"])
                .order_by("-id")
                .values("hash")
                .first()
            )
            if preceding is not None:
                seed_prev_hash = preceding["hash"] or ZERO_HASH

        prev_hash = seed_prev_hash
        checked = 0
        for entry in queryset.iterator():
            is_anchor = checked == 0 and prev_hash is None

            if is_anchor and options["strict_head"]:
                if entry.prev_hash != ZERO_HASH:
                    self.stderr.write(
                        self.style.ERROR(
                            f"--strict-head: anchor row id={entry.id} has "
                            f"non-zero prev_hash ({entry.prev_hash!r}). "
                            f"The chain origin appears to have been purged "
                            f"or tampered with."
                        )
                    )
                    sys.exit(1)

            # Chain-link check skipped on the anchor row — its predecessor is
            # either outside the window (--from) or has been purged.
            if not is_anchor and entry.prev_hash != prev_hash:
                self.stderr.write(
                    self.style.ERROR(
                        f"prev_hash mismatch at id={entry.id}: "
                        f"stored={entry.prev_hash!r}, expected={prev_hash!r}."
                    )
                )
                sys.exit(1)

            # Self-consistency check runs on every row, including the anchor:
            # tampering with the anchor's content still flips its own hash.
            expected = compute_event_hash(entry, entry.prev_hash)
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
