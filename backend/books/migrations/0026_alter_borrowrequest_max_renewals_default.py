from django.db import migrations, models


def limit_existing_borrows_to_one_renewal(apps, schema_editor):
    BorrowRequest = apps.get_model('books', 'BorrowRequest')
    BorrowRequest.objects.filter(max_renewals__gt=1, renewal_count__lte=1).update(max_renewals=1)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('books', '0025_renewalrequest'),
    ]

    operations = [
        migrations.AlterField(
            model_name='borrowrequest',
            name='max_renewals',
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.RunPython(limit_existing_borrows_to_one_renewal, noop_reverse),
    ]
