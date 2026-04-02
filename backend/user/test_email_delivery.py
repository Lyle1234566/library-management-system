import json
import smtplib
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import SimpleTestCase, TestCase
from django.test.utils import override_settings
from rest_framework import status
from rest_framework.test import APIClient

from user.email_delivery import get_email_config_error, send_email_message


VALID_TEACHER_PASSWORD = 'TeacherPass123!'


def build_resend_response(status_code: int = 200) -> MagicMock:
    response = MagicMock()
    entered = MagicMock()
    entered.status = status_code
    entered.read.return_value = b'{"id":"email_123"}'
    response.__enter__.return_value = entered
    return response


@override_settings(
    EMAIL_PROVIDER='resend',
    RESEND_API_KEY='re_test_key',
    RESEND_FROM_EMAIL='onboarding@resend.dev',
    DEFAULT_FROM_EMAIL='onboarding@resend.dev',
)
class ResendEmailDeliveryTests(SimpleTestCase):
    @patch('user.email_delivery.request.urlopen')
    def test_send_email_message_posts_to_resend_api(self, mock_urlopen):
        mock_urlopen.return_value = build_resend_response()

        send_email_message(
            recipient='student@example.com',
            subject='Login Verification Code',
            text_body='Your code is 123456',
            html_body='<strong>Your code is 123456</strong>',
        )

        self.assertTrue(mock_urlopen.called)
        request_obj = mock_urlopen.call_args.args[0]
        payload = json.loads(request_obj.data.decode('utf-8'))

        self.assertEqual(request_obj.full_url, 'https://api.resend.com/emails')
        self.assertEqual(request_obj.get_method(), 'POST')
        self.assertEqual(request_obj.headers['Authorization'], 'Bearer re_test_key')
        self.assertEqual(payload['from'], 'onboarding@resend.dev')
        self.assertEqual(payload['to'], ['student@example.com'])
        self.assertEqual(payload['subject'], 'Login Verification Code')

    @override_settings(RESEND_API_KEY='', RESEND_FROM_EMAIL='')
    def test_resend_provider_requires_api_key_and_sender(self):
        error = get_email_config_error()
        self.assertIsNotNone(error)
        self.assertIn('RESEND_API_KEY', error)
        self.assertIn('RESEND_FROM_EMAIL', error)

    @override_settings(EMAIL_PROVIDER='auto')
    @patch('user.email_delivery.request.urlopen')
    def test_send_email_message_uses_resend_when_auto_provider_detects_resend_config(self, mock_urlopen):
        mock_urlopen.return_value = build_resend_response()

        send_email_message(
            recipient='student@example.com',
            subject='Login Verification Code',
            text_body='Your code is 123456',
            html_body='<strong>Your code is 123456</strong>',
        )

        self.assertTrue(mock_urlopen.called)

    @override_settings(
        EMAIL_PROVIDER='smtp',
        EMAIL_BACKEND='django.core.mail.backends.smtp.EmailBackend',
        EMAIL_HOST='smtp.gmail.com',
        EMAIL_HOST_PASSWORD='abcd efgh ijkl mnop',
    )
    def test_gmail_app_password_spaces_are_removed_for_smtp(self):
        with patch('user.email_delivery.get_connection') as mock_get_connection:
            send_email_message(
                recipient='student@example.com',
                subject='Login Verification Code',
                text_body='Your code is 123456',
                html_body='<strong>Your code is 123456</strong>',
            )

        self.assertTrue(mock_get_connection.called)
        self.assertEqual(mock_get_connection.call_args.kwargs['password'], 'abcdefghijklmnop')


@override_settings(
    EMAIL_PROVIDER='bridge',
    EMAIL_BRIDGE_URL='https://example.vercel.app/api/email/send',
    EMAIL_BRIDGE_SECRET='bridge-secret',
)
class EmailBridgeDeliveryTests(SimpleTestCase):
    @patch('user.email_delivery.request.urlopen')
    def test_send_email_message_posts_to_email_bridge(self, mock_urlopen):
        mock_urlopen.return_value = build_resend_response()

        send_email_message(
            recipient='student@example.com',
            subject='Login Verification Code',
            text_body='Your code is 123456',
            html_body='<strong>Your code is 123456</strong>',
        )

        self.assertTrue(mock_urlopen.called)
        request_obj = mock_urlopen.call_args.args[0]
        payload = json.loads(request_obj.data.decode('utf-8'))

        self.assertEqual(request_obj.full_url, 'https://example.vercel.app/api/email/send')
        self.assertEqual(request_obj.get_method(), 'POST')
        self.assertEqual(request_obj.headers['X-email-bridge-secret'], 'bridge-secret')
        self.assertEqual(payload['recipient'], 'student@example.com')
        self.assertEqual(payload['subject'], 'Login Verification Code')
        self.assertEqual(payload['textBody'], 'Your code is 123456')

    @override_settings(EMAIL_BRIDGE_URL='', EMAIL_BRIDGE_SECRET='')
    def test_email_bridge_requires_url_and_secret(self):
        error = get_email_config_error()
        self.assertIsNotNone(error)
        self.assertIn('EMAIL_BRIDGE_URL', error)
        self.assertIn('EMAIL_BRIDGE_SECRET', error)


@override_settings(
    EMAIL_PROVIDER='resend',
    RESEND_API_KEY='re_test_key',
    RESEND_FROM_EMAIL='onboarding@resend.dev',
    DEFAULT_FROM_EMAIL='onboarding@resend.dev',
)
class ResendRegistrationIntegrationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch('user.email_delivery.request.urlopen')
    def test_teacher_registration_returns_otp_challenge_with_resend(self, mock_urlopen):
        mock_urlopen.return_value = build_resend_response()

        response = self.client.post(
            '/api/auth/register/',
            {
                'role': 'TEACHER',
                'staff_id': 'T-9901',
                'full_name': 'Teacher Applicant',
                'email': 'teacher-applicant@example.com',
                'password': VALID_TEACHER_PASSWORD,
                'password_confirm': VALID_TEACHER_PASSWORD,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['requires_otp'])
        self.assertEqual(response.data['role'], 'TEACHER')
        self.assertEqual(response.data['staff_id'], 'T-9901')
        self.assertFalse(get_user_model().objects.filter(username='T-9901').exists())
        self.assertTrue(mock_urlopen.called)

    @override_settings(EMAIL_PROVIDER='auto')
    @patch('user.email_delivery.request.urlopen')
    def test_teacher_registration_detects_resend_without_explicit_provider(self, mock_urlopen):
        mock_urlopen.return_value = build_resend_response()

        response = self.client.post(
            '/api/auth/register/',
            {
                'role': 'TEACHER',
                'staff_id': 'T-9902',
                'full_name': 'Teacher Applicant Auto',
                'email': 'teacher-applicant-auto@example.com',
                'password': VALID_TEACHER_PASSWORD,
                'password_confirm': VALID_TEACHER_PASSWORD,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['requires_otp'])
        self.assertTrue(mock_urlopen.called)

    @override_settings(EMAIL_PROVIDER='smtp')
    @patch('user.email_delivery.request.urlopen')
    @patch('user.email_delivery._send_via_smtp')
    def test_teacher_registration_falls_back_to_resend_when_smtp_fails(self, mock_send_via_smtp, mock_urlopen):
        mock_send_via_smtp.side_effect = smtplib.SMTPException('SMTP blocked')
        mock_urlopen.return_value = build_resend_response()

        response = self.client.post(
            '/api/auth/register/',
            {
                'role': 'TEACHER',
                'staff_id': 'T-9903',
                'full_name': 'Teacher Applicant Fallback',
                'email': 'teacher-applicant-fallback@example.com',
                'password': VALID_TEACHER_PASSWORD,
                'password_confirm': VALID_TEACHER_PASSWORD,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['requires_otp'])
        self.assertTrue(mock_send_via_smtp.called)
        self.assertTrue(mock_urlopen.called)

    @patch('user.email_delivery._send_via_resend')
    def test_teacher_registration_returns_resend_testing_mode_hint_when_sender_is_rejected(self, mock_send_via_resend):
        mock_send_via_resend.side_effect = RuntimeError(
            'Resend API request failed with status 403: You can only send testing emails to your own email address.'
        )

        response = self.client.post(
            '/api/auth/register/',
            {
                'role': 'TEACHER',
                'staff_id': 'T-9904',
                'full_name': 'Teacher Applicant Testing Mode',
                'email': 'teacher-applicant-testing@example.com',
                'password': VALID_TEACHER_PASSWORD,
                'password_confirm': VALID_TEACHER_PASSWORD,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('Resend is still in testing mode.', response.data['detail'])
        self.assertIn('Verify your domain in Resend', response.data['detail'])


@override_settings(
    EMAIL_PROVIDER='bridge',
    EMAIL_BRIDGE_URL='https://example.vercel.app/api/email/send',
    EMAIL_BRIDGE_SECRET='bridge-secret',
)
class EmailBridgeRegistrationIntegrationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch('user.email_delivery._send_via_http_bridge')
    def test_teacher_registration_surfaces_missing_vercel_env_variable(self, mock_send_via_http_bridge):
        mock_send_via_http_bridge.side_effect = RuntimeError(
            'Email bridge request failed with status 500: {"detail":"Missing required environment variable: MAILER_GMAIL_USER"}'
        )

        response = self.client.post(
            '/api/auth/register/',
            {
                'role': 'TEACHER',
                'staff_id': 'T-9905',
                'full_name': 'Teacher Applicant Bridge Missing Env',
                'email': 'teacher-applicant-bridge-env@example.com',
                'password': VALID_TEACHER_PASSWORD,
                'password_confirm': VALID_TEACHER_PASSWORD,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('Vercel is missing `MAILER_GMAIL_USER`.', response.data['detail'])

    @patch('user.email_delivery._send_via_http_bridge')
    def test_teacher_registration_surfaces_gmail_auth_failure(self, mock_send_via_http_bridge):
        mock_send_via_http_bridge.side_effect = RuntimeError(
            'Email bridge request failed with status 500: {"detail":"Gmail authentication failed. Check MAILER_GMAIL_USER and MAILER_GMAIL_APP_PASSWORD."}'
        )

        response = self.client.post(
            '/api/auth/register/',
            {
                'role': 'TEACHER',
                'staff_id': 'T-9906',
                'full_name': 'Teacher Applicant Bridge Gmail Auth',
                'email': 'teacher-applicant-bridge-auth@example.com',
                'password': VALID_TEACHER_PASSWORD,
                'password_confirm': VALID_TEACHER_PASSWORD,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('Gmail login failed in the Vercel bridge.', response.data['detail'])
