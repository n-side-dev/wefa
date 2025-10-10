"""
Authentication constants for the nside_wefa.authentication app.

These names are used throughout the project to configure and validate the
supported authentication mechanisms.

:data AUTH_TYPE_TOKEN: Identifier for token-based authentication.
:data AUTH_TYPE_JWT: Identifier for JWT-based authentication.
:data AUTHENTICATION_TYPES: Ordered list of all supported authentication types.
"""

AUTH_TYPE_TOKEN = "TOKEN"  # nosec
AUTH_TYPE_JWT = "JWT"

AUTHENTICATION_TYPES = [AUTH_TYPE_TOKEN, AUTH_TYPE_JWT]
