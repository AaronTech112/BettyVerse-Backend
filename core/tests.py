from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from .models import User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class EmailVerificationFlowTests(TestCase):
    def test_signup_creates_inactive_user_and_sends_verification_code(self):
        response = self.client.post(
            reverse("signup"),
            {
                "username": "newclient",
                "email": "newclient@example.com",
                "password1": "StrongPass123!",
                "password2": "StrongPass123!",
                "phone": "1234567890",
            },
        )

        user = User.objects.get(email="newclient@example.com")

        self.assertRedirects(response, reverse("verify_email"))
        self.assertFalse(user.is_active)
        self.assertFalse(user.is_email_verified)
        self.assertEqual(len(user.email_verification_code), 6)
        self.assertEqual(self.client.session.get("pending_verification_user_id"), user.id)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(user.email_verification_code, mail.outbox[0].body)

    def test_verification_code_activates_user_and_logs_them_in(self):
        user = User.objects.create(
            username="verifyme",
            email="verifyme@example.com",
            is_active=False,
            is_email_verified=False,
            email_verification_code="123456",
            email_verification_sent_at=timezone.now(),
        )
        user.set_password("StrongPass123!")
        user.save()

        session = self.client.session
        session["pending_verification_user_id"] = user.id
        session.save()

        response = self.client.post(
            reverse("verify_email"),
            {
                "email": user.email,
                "code": "123456",
            },
        )

        user.refresh_from_db()

        self.assertRedirects(response, reverse("dashboard"))
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_email_verified)
        self.assertEqual(user.email_verification_code, "")
        self.assertEqual(str(self.client.session.get("_auth_user_id")), str(user.id))

    def test_login_redirects_unverified_user_to_verification_page(self):
        user = User.objects.create(
            username="pendinguser",
            email="pending@example.com",
            is_active=False,
            is_email_verified=False,
            email_verification_code="654321",
            email_verification_sent_at=timezone.now(),
        )
        user.set_password("StrongPass123!")
        user.save()

        response = self.client.post(
            reverse("login"),
            {
                "username": user.email,
                "password": "StrongPass123!",
            },
        )

        self.assertRedirects(response, f"{reverse('verify_email')}?email={user.email}")
        self.assertEqual(self.client.session.get("pending_verification_user_id"), user.id)
