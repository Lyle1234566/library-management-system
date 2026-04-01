import os

from django.core.management.base import BaseCommand

from user.models import User


class Command(BaseCommand):
    help = "Create or update an admin user from environment variables."

    def handle(self, *args, **options):
        username = os.getenv('DJANGO_SUPERUSER_USERNAME', '').strip()
        password = os.getenv('DJANGO_SUPERUSER_PASSWORD', '').strip()
        full_name = os.getenv('DJANGO_SUPERUSER_FULL_NAME', '').strip() or 'Render Admin'
        email = os.getenv('DJANGO_SUPERUSER_EMAIL', '').strip().lower() or None

        if not username or not password:
            self.stdout.write(
                self.style.WARNING(
                    'Skipping admin bootstrap. Set DJANGO_SUPERUSER_USERNAME and '
                    'DJANGO_SUPERUSER_PASSWORD to enable it.'
                )
            )
            return

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'full_name': full_name,
                'email': email,
                'role': 'ADMIN',
                'is_active': True,
                'is_staff': True,
                'is_superuser': True,
                'email_verified': bool(email),
            },
        )

        user.full_name = full_name
        user.email = email
        user.role = 'ADMIN'
        user.is_active = True
        user.is_staff = True
        user.is_superuser = True
        if email:
            user.email_verified = True
        user.set_password(password)
        user.save()

        action = 'Created' if created else 'Updated'
        self.stdout.write(self.style.SUCCESS(f'{action} admin user "{username}".'))
