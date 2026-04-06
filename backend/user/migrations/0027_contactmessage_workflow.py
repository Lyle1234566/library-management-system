from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0026_user_email_ci_unique'),
    ]

    operations = [
        migrations.AddField(
            model_name='contactmessage',
            name='handled_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='contactmessage',
            name='handled_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='handled_contact_messages',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='contactmessage',
            name='internal_notes',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='contactmessage',
            name='status',
            field=models.CharField(
                choices=[('NEW', 'New'), ('IN_PROGRESS', 'In progress'), ('RESOLVED', 'Resolved')],
                default='NEW',
                max_length=20,
            ),
        ),
    ]
