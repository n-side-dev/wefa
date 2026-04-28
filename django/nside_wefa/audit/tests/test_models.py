"""Tests for the tamper-evident WefaLogEntry hash chain."""

from django.contrib.contenttypes.models import ContentType
from django.test import TestCase

from auditlog.models import LogEntry

from nside_wefa.audit.models import (
    HASH_LENGTH,
    WefaLogEntry,
    ZERO_HASH,
    compute_event_hash,
)


def _make_entry(**overrides):
    """Helper that creates a minimal WefaLogEntry."""
    kwargs = dict(
        action=LogEntry.Action.UPDATE,
        content_type=ContentType.objects.get_for_model(LogEntry),
        object_pk="0",
        object_repr="test",
        additional_data={},
    )
    kwargs.update(overrides)
    return WefaLogEntry.objects.create(**kwargs)


class HashChainTest(TestCase):
    def test_first_event_uses_zero_prev_hash(self):
        WefaLogEntry.objects.all().__class__  # touch the model
        entry = _make_entry(additional_data={"action": "first"})
        self.assertEqual(entry.prev_hash, ZERO_HASH)
        self.assertEqual(len(entry.hash), HASH_LENGTH)

    def test_subsequent_events_link_to_previous_hash(self):
        first = _make_entry(additional_data={"action": "first"})
        second = _make_entry(additional_data={"action": "second"})
        self.assertEqual(second.prev_hash, first.hash)
        self.assertNotEqual(second.hash, first.hash)

    def test_compute_event_hash_is_deterministic(self):
        first = _make_entry(additional_data={"action": "first"})
        recomputed = compute_event_hash(first, ZERO_HASH)
        self.assertEqual(recomputed, first.hash)

    def test_compute_event_hash_changes_with_content(self):
        first = _make_entry(additional_data={"action": "first"})
        first.refresh_from_db()
        original = first.hash

        # Manually mutate ``object_repr`` in raw SQL so the immutability guard
        # doesn't fire — emulating a tampered DB row.
        WefaLogEntry.objects.filter(pk=first.pk)._raw_delete  # noqa: B018
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE audit_wefalogentry SET object_repr = 'tampered' WHERE id = %s",
                [first.pk],
            )
        first.refresh_from_db()
        self.assertEqual(first.hash, original)
        self.assertNotEqual(compute_event_hash(first, ZERO_HASH), original)
