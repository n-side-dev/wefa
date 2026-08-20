from django.apps import AppConfig


class AttachmentsTestAppConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "nside_wefa.attachments.tests.test_app"
    label = "attachments_test_app"
    verbose_name = "WeFa Attachments Test App"
