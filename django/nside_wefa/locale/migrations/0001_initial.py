import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def create_user_locales_for_existing_users(apps, schema_editor):
    """Create UserLocale rows for all existing users."""
    User = apps.get_model(settings.AUTH_USER_MODEL)
    UserLocale = apps.get_model("locale", "UserLocale")

    for user in User.objects.all():
        UserLocale.objects.create(user=user)


def reverse_create_user_locales(apps, schema_editor):
    """Remove all UserLocale rows."""
    UserLocale = apps.get_model("locale", "UserLocale")
    UserLocale.objects.all().delete()


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserLocale",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "code",
                    models.CharField(
                        blank=True,
                        help_text="BCP-47 style locale code (e.g. 'en', 'fr-BE').",
                        max_length=16,
                        null=True,
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        help_text="User whose preferred locale is tracked.",
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "User Locale",
                "verbose_name_plural": "User Locales",
            },
        ),
        migrations.RunPython(
            create_user_locales_for_existing_users,
            reverse_create_user_locales,
        ),
    ]
