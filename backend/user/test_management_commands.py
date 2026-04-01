import io
import os
from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase

from user.models import User


class EnsureAdminUserCommandTests(TestCase):
    def test_command_skips_when_required_env_vars_are_missing(self):
        output = io.StringIO()

        with patch.dict(os.environ, {}, clear=False):
            call_command('ensure_admin_user', stdout=output)

        self.assertIn('Skipping admin bootstrap', output.getvalue())
        self.assertFalse(User.objects.filter(username='render-admin').exists())

    def test_command_creates_admin_user_from_env_vars(self):
        output = io.StringIO()

        with patch.dict(
            os.environ,
            {
                'DJANGO_SUPERUSER_USERNAME': 'render-admin',
                'DJANGO_SUPERUSER_PASSWORD': 'StrongPassword123!',
                'DJANGO_SUPERUSER_FULL_NAME': 'Render Admin',
                'DJANGO_SUPERUSER_EMAIL': 'admin@example.com',
            },
            clear=False,
        ):
            call_command('ensure_admin_user', stdout=output)

        user = User.objects.get(username='render-admin')
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_active)
        self.assertTrue(user.email_verified)
        self.assertEqual(user.role, 'ADMIN')
        self.assertTrue(user.check_password('StrongPassword123!'))
        self.assertIn('Created admin user', output.getvalue())
