from django.conf import settings


def get_authentication_types():
    return settings.NSIDE_WEFA.get("AUTHENTICATION").get("TYPES")
