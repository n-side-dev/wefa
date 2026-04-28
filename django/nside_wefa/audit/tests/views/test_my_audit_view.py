"""Tests for ``GET /audit/me/``."""

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from nside_wefa import audit


class MyAuditEventListViewTest(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice")
        self.bob = User.objects.create_user(username="bob")
        self.alice_event = audit.log("demo.act", actor=self.alice)
        self.bob_event = audit.log("demo.act", actor=self.bob)
        self.url = reverse("audit:my_events")

    def test_anonymous_returns_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_only_authenticated_users_events(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.get(self.url)
        ids = [row["id"] for row in response.data]
        self.assertIn(self.alice_event.id, ids)
        self.assertNotIn(self.bob_event.id, ids)

    def test_supports_action_filter(self):
        self.client.force_authenticate(user=self.alice)
        other = audit.log("demo.unrelated", actor=self.alice)
        response = self.client.get(self.url, {"action": "demo.act"})
        ids = [row["id"] for row in response.data]
        self.assertIn(self.alice_event.id, ids)
        self.assertNotIn(other.id, ids)

    def test_invalid_filter_returns_400(self):
        self.client.force_authenticate(user=self.alice)
        response = self.client.get(self.url, {"timestamp__lte": "tomorrow"})
        self.assertEqual(response.status_code, 400)
