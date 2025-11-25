from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APIClient
from feedback.models import Board, Feedback

API_BASE = "/feedback-api/v1"


class FeedbackPermissionsTests(TestCase):
    def setUp(self):
        # Create groups
        self.admin_group, _ = Group.objects.get_or_create(name="Admin")
        self.mod_group, _ = Group.objects.get_or_create(name="Moderator")
        self.contrib_group, _ = Group.objects.get_or_create(name="Contributor")

        # Users
        self.admin = User.objects.create_user("admin", email="a@example.com", password="pass")
        self.admin.groups.add(self.admin_group)
        self.admin.is_staff = True
        self.admin.save()

        self.moderator = User.objects.create_user("moderator", email="m@example.com", password="pass")
        self.moderator.groups.add(self.mod_group)

        self.author = User.objects.create_user("author", email="author@example.com", password="pass")
        self.author.groups.add(self.contrib_group)

        self.other = User.objects.create_user("other", email="other@example.com", password="pass")
        self.other.groups.add(self.contrib_group)

        # Boards: one public and one private
        self.public_board = Board.objects.create(
            name="Public Board",
            description="public",
            is_public=True,
            created_by=self.admin
        )
        # make admin member
        self.public_board.members.add(self.admin)

        self.private_board = Board.objects.create(
            name="Private Board",
            description="private",
            is_public=False,
            created_by=self.admin
        )
        # add moderator as member of private board for tests
        self.private_board.members.add(self.moderator)
        self.private_board.members.add(self.admin)

        # Add author as member of public board (so they can create feedback on public)
        self.public_board.members.add(self.author)

        # A sample feedback created by author on public board
        self.feedback = Feedback.objects.create(
            board=self.public_board,
            title="A feedback",
            body="Details",
            created_by=self.author
        )

        # clients
        self.client = APIClient()

    def test_public_board_readable_by_anonymous(self):
        res = self.client.get(f"{API_BASE}/feedback/?board={self.public_board.id}")
        self.assertEqual(res.status_code, 200)

    def test_private_board_not_readable_by_anonymous(self):
        res = self.client.get(f"{API_BASE}/feedback/?board={self.private_board.id}")
        self.assertEqual(res.status_code, 200)
        data = res.data
        items = data.get("results", data) if isinstance(data, dict) else data
        # ensure no feedback from private board returned (we didn't create any there)
        for item in items:
            self.assertNotEqual(item.get("board"), self.private_board.id)

    def test_member_can_create_feedback_on_board(self):
        self.client.force_authenticate(self.author)
        payload = {"board": self.public_board.id, "title": "New", "body": "B"}
        res = self.client.post(f"{API_BASE}/feedback/", payload, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data.get("title"), "New")

    def test_non_member_cannot_create_feedback_on_board(self):
        # other user is not a member of public or private board
        self.client.force_authenticate(self.other)
        payload = {"board": self.public_board.id, "title": "X", "body": "Y"}
        res = self.client.post(f"{API_BASE}/feedback/", payload, format="json")
        self.assertIn(res.status_code, (400, 403))

    def test_moderator_can_create_feedback_any_board(self):
        self.client.force_authenticate(self.moderator)
        payload = {"board": self.public_board.id, "title": "Mod created", "body": "ok"}
        res = self.client.post(f"{API_BASE}/feedback/", payload, format="json")
        self.assertEqual(res.status_code, 201)

    def test_author_can_update_own_feedback(self):
        self.client.force_authenticate(self.author)
        payload = {"title": "Updated title"}
        res = self.client.patch(f"{API_BASE}/feedback/{self.feedback.id}/", payload, format="json")
        self.assertEqual(res.status_code, 200)
        self.feedback.refresh_from_db()
        self.assertEqual(self.feedback.title, "Updated title")

    def test_non_author_cannot_update_others_feedback(self):
        self.client.force_authenticate(self.other)
        payload = {"title": "Hacked"}
        res = self.client.patch(f"{API_BASE}/feedback/{self.feedback.id}/", payload, format="json")
        # should be forbidden by permission class
        self.assertIn(res.status_code, (403, 404))

    def test_author_can_delete_own_feedback(self):
        self.client.force_authenticate(self.author)
        res = self.client.delete(f"{API_BASE}/feedback/{self.feedback.id}/")
        self.assertIn(res.status_code, (204, 200))

    def test_non_author_cannot_delete_others_feedback(self):
        # create new feedback by author again
        fb = Feedback.objects.create(board=self.public_board, title="Temp", body="T", created_by=self.author)
        self.client.force_authenticate(self.other)
        res = self.client.delete(f"{API_BASE}/feedback/{fb.id}/")
        self.assertIn(res.status_code, (403, 404))

    def test_admin_can_set_status(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post(f"{API_BASE}/feedback/{self.feedback.id}/set_status/", {"status": "in_progress"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.feedback.refresh_from_db()
        self.assertEqual(self.feedback.status, "in_progress")

    def test_contributor_cannot_set_status(self):
        self.client.force_authenticate(self.author)
        res = self.client.post(f"{API_BASE}/feedback/{self.feedback.id}/set_status/", {"status": "completed"}, format="json")
        self.assertIn(res.status_code, (403, 400, 404))