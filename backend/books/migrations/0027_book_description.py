from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0026_alter_borrowrequest_max_renewals_default'),
    ]

    operations = [
        migrations.AddField(
            model_name='book',
            name='description',
            field=models.TextField(blank=True, default=''),
        ),
    ]
