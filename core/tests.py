from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from .models import NewsletterCampaign, NewsletterSubscriber, User


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


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class NewsletterFlowTests(TestCase):
    def test_footer_subscription_creates_subscriber(self):
        response = self.client.post(
            reverse("newsletter_subscribe"),
            {"email": "subscriber@example.com", "next": reverse("home")},
        )

        self.assertRedirects(
            response,
            f"{reverse('newsletter_subscribe_success')}?email=subscriber%40example.com&status=subscribed&return_to=%2F",
        )
        self.assertTrue(
            NewsletterSubscriber.objects.filter(email="subscriber@example.com", is_active=True).exists()
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["subscriber@example.com"])
        self.assertIn("Welcome to the BettyVerse newsletter", mail.outbox[0].subject)

    def test_footer_subscription_reactivates_existing_subscriber(self):
        NewsletterSubscriber.objects.create(email="subscriber@example.com", is_active=False)

        response = self.client.post(
            reverse("newsletter_subscribe"),
            {"email": "subscriber@example.com", "next": reverse("home")},
        )

        subscriber = NewsletterSubscriber.objects.get(email="subscriber@example.com")
        self.assertTrue(subscriber.is_active)
        self.assertRedirects(
            response,
            f"{reverse('newsletter_subscribe_success')}?email=subscriber%40example.com&status=subscribed&return_to=%2F",
        )
        self.assertEqual(len(mail.outbox), 1)

    def test_footer_subscription_redirects_already_subscribed_user_to_confirmation_page(self):
        NewsletterSubscriber.objects.create(email="subscriber@example.com", is_active=True)

        response = self.client.post(
            reverse("newsletter_subscribe"),
            {"email": "subscriber@example.com", "next": reverse("home")},
        )

        self.assertRedirects(
            response,
            f"{reverse('newsletter_subscribe_success')}?email=subscriber%40example.com&status=already-subscribed&return_to=%2F",
        )
        self.assertEqual(len(mail.outbox), 0)

    def test_staff_can_send_newsletter_to_active_subscribers_only(self):
        staff_user = User.objects.create_user(
            username="staffuser",
            email="staff@example.com",
            password="StrongPass123!",
            is_staff=True,
            is_active=True,
            is_email_verified=True,
        )
        NewsletterSubscriber.objects.create(email="active1@example.com", is_active=True)
        NewsletterSubscriber.objects.create(email="active2@example.com", is_active=True)
        NewsletterSubscriber.objects.create(email="inactive@example.com", is_active=False)

        self.client.force_login(staff_user)
        response = self.client.post(
            reverse("newsletter_admin"),
            {
                "subject": "New Offers",
                "body": "This is our latest newsletter.",
            },
        )

        self.assertRedirects(response, reverse("newsletter_admin"))
        campaign = NewsletterCampaign.objects.get(subject="New Offers")
        self.assertEqual(campaign.recipient_count, 2)
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(sorted(message.to[0] for message in mail.outbox), ["active1@example.com", "active2@example.com"])
