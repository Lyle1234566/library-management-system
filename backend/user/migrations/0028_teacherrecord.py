from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0027_contactmessage_workflow'),
    ]

    operations = [
        migrations.CreateModel(
            name='TeacherRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('staff_id', models.CharField(help_text='Official faculty ID from the teacher records list.', max_length=20, unique=True, verbose_name='Faculty ID')),
                ('full_name', models.CharField(blank=True, max_length=100)),
                ('school_email', models.EmailField(blank=True, max_length=254)),
                ('department', models.CharField(blank=True, max_length=120)),
                ('is_active_for_registration', models.BooleanField(default=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Teacher record',
                'verbose_name_plural': 'Teacher records',
                'ordering': ['staff_id'],
            },
        ),
    ]
