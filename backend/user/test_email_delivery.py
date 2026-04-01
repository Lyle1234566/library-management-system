import json
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
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


@override_settings(
    EMAIL_PROVIDER='resend',
    RESEND_API_KEY='re_test_key',
    RESEND_FROM_EMAIL='onboarding@resend.dev',
    DEFAULT_FROM_EMAIL='onboarding@resend.dev',
)
class ResendRegistrationIntegrationTests(TestCase):
    def setUp(self):
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
        self.assertEqual(response.data['user']['role'], 'TEACHER')
        self.assertEqual(response.data['user']['staff_id'], 'T-9901')

        user = get_user_model().objects.get(username='T-9901')
        self.assertFalse(user.email_verified)
        self.assertFalse(user.is_active)
        self.assertTrue(mock_urlopen.called)
