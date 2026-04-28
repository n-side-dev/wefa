"""Tests for staff-facing audit endpoints."""

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from nside_wefa import audit


class AuditEventListViewPermissionsTest(APITestCase):
    def test_anonymous_returns_401_or_403(self):
        url = reverse("audit:events_list")
        response = self.client.get(url)
        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_non_staff_user_returns_403(self):
        user = User.objects.create_user(username="plain")
        self.client.force_authenticate(user=user)
        response = self.client.get(reverse("audit:events_list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_user_returns_200(self):
        staff = User.objects.create_user(username="ops", password="x", is_staff=True)
        self.client.force_authenticate(user=staff)
        response = self.client.get(reverse("audit:events_list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class AuditEventListFilteringTest(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="ops", password="x", is_staff=True
        )
        self.user_a = User.objects.create_user(username="alice")
        self.user_b = User.objects.create_user(username="bob")
        # Drop User-creation noise so we can assert on counts deterministically.
        # User registration is a Path D entry only for auth.Group, so the
        # creation events above don't auto-log; we explicitly emit fixtures.
        self.event_alice = audit.log("demo.alice_action", actor=self.user_a)
        self.event_bob = audit.log("demo.bob_action", actor=self.user_b)
        self.event_failed = audit.log(
            "demo.alice_action",
            actor=self.user_a,
            outcome=audit.Outcome.FAILURE,
        )
        self.client.force_authenticate(user=self.staff)
        self.url = reverse("audit:events_list")

    def _ids(self, response) -> list:
        return [item["id"] for item in response.data]

    def test_lists_all_events(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        ids = self._ids(response)
        for ev in (self.event_alice, self.event_bob, self.event_failed):
            self.assertIn(ev.id, ids)

    def test_filter_by_action(self):
        response = self.client.get(self.url, {"action": "demo.bob_action"})
        ids = self._ids(response)
        self.assertIn(self.event_bob.id, ids)
        self.assertNotIn(self.event_alice.id, ids)

    def test_filter_by_action_prefix(self):
        response = self.client.get(self.url, {"action__startswith": "demo.alice"})
        ids = self._ids(response)
        self.assertIn(self.event_alice.id, ids)
        self.assertIn(self.event_failed.id, ids)
        self.assertNotIn(self.event_bob.id, ids)

    def test_filter_by_actor(self):
        response = self.client.get(self.url, {"actor": str(self.user_a.id)})
        ids = self._ids(response)
        self.assertIn(self.event_alice.id, ids)
        self.assertNotIn(self.event_bob.id, ids)

    def test_filter_by_outcome(self):
        response = self.client.get(self.url, {"outcome": "failure"})
        ids = self._ids(response)
        self.assertIn(self.event_failed.id, ids)
        self.assertNotIn(self.event_alice.id, ids)

    def test_invalid_actor_returns_400(self):
        response = self.client.get(self.url, {"actor": "not-an-int"})
        self.assertEqual(response.status_code, 400)

    def test_invalid_target_type_returns_400(self):
        response = self.client.get(self.url, {"target_type": "garbage"})
        self.assertEqual(response.status_code, 400)

    def test_invalid_timestamp_returns_400(self):
        response = self.client.get(self.url, {"timestamp__gte": "yesterday"})
        self.assertEqual(response.status_code, 400)

    def test_filter_by_target_type_and_id(self):
        response = self.client.get(
            self.url,
            {"target_type": "auth.user", "target_id": str(self.user_a.id)},
        )
        ids = self._ids(response)
        self.assertIn(self.event_alice.id, ids)
        self.assertNotIn(self.event_bob.id, ids)


class AuditEventDetailViewTest(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="ops", password="x", is_staff=True
        )
        self.user = User.objects.create_user(username="u")
        self.event = audit.log("demo.detail", actor=self.user)
        self.client.force_authenticate(user=self.staff)

    def test_returns_event_payload(self):
        url = reverse("audit:events_detail", args=[self.event.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], self.event.id)
        self.assertEqual(response.data["action"], "demo.detail")

    def test_unknown_id_returns_404(self):
        url = reverse("audit:events_detail", args=[10**9])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_non_staff_returns_403(self):
        plain = User.objects.create_user(username="plain")
        self.client.force_authenticate(user=plain)
        url = reverse("audit:events_detail", args=[self.event.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)
