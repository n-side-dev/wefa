# WeFa Authentication App

A Django application for managing authentication configurations in Django REST Framework applications, providing automatic setup for Token and JWT authentication methods.

## Overview

The Authentication app simplifies Django REST Framework authentication setup by automatically configuring authentication classes and permission classes based on your settings. It supports both Token-based authentication and JWT (JSON Web Token) authentication with automatic endpoint generation and dependency validation.

## Features

- **Automatic DRF Configuration**: Automatically configures Django REST Framework authentication and permission settings
- **Multiple Authentication Types**: Supports both Token and JWT authentication methods
- **Dynamic URL Generation**: Conditionally generates authentication endpoints based on configuration
- **Dependency Validation**: Ensures proper INSTALLED_APPS ordering and configuration
- **Settings Validation**: Comprehensive system checks for configuration validation
- **Flexible Configuration**: Easy-to-configure authentication types through Django settings

## Installation

1. Add the required dependencies and `'nside_wefa.authentication'` to your `INSTALLED_APPS` in Django settings:

```python
INSTALLED_APPS = [
    # ... other apps
    'rest_framework',
    'rest_framework.authtoken',          # Required for Token authentication
    'rest_framework_simplejwt',          # Required for JWT authentication
    'nside_wefa.common',                 # Must come before authentication
    'nside_wefa.authentication',
]
```

2. Run migrations to create the necessary database tables (for Token authentication):

```bash
python manage.py migrate
```

3. Include the Authentication URLs in your project's main `urls.py`:

```python
from django.urls import path, include

urlpatterns = [
    # ... other URL patterns
    path('auth/', include('nside_wefa.authentication.urls')),
    # ... other URL patterns
]
```

## Configuration

Configure the Authentication app in your Django settings:

```python
NSIDE_WEFA = {
    "AUTHENTICATION": {
        "TYPES": ["TOKEN", "JWT"],  # Specify which authentication types to enable
    },
}
```

**Required settings:**
- `NSIDE_WEFA.AUTHENTICATION.TYPES`: List of authentication types to enable

**Supported authentication types:**
- `"TOKEN"`: Django REST Framework Token Authentication
- `"JWT"`: Simple JWT Authentication

## Authentication Types

### Token Authentication

When `"TOKEN"` is included in `AUTHENTICATION.TYPES`:

- **Endpoint**: `POST /auth/token-auth/`
- **Authentication Class**: `rest_framework.authentication.TokenAuthentication`
- **Required App**: `rest_framework.authtoken` in INSTALLED_APPS
- **Usage**: Send username/password to get an authentication token

**Example request:**
```bash
curl -X POST http://your-domain/auth/token-auth/ \
     -H "Content-Type: application/json" \
     -d '{"username": "your_username", "password": "your_password"}'
```

**Example response:**
```json
{
    "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
}
```

### JWT Authentication

When `"JWT"` is included in `AUTHENTICATION.TYPES`:

- **Token Obtain**: `POST /auth/token/`
- **Token Refresh**: `POST /auth/token/refresh/`
- **Authentication Class**: `rest_framework_simplejwt.authentication.JWTAuthentication`
- **Required App**: `rest_framework_simplejwt` in INSTALLED_APPS
- **Usage**: JWT token-based authentication with refresh capability

**Example token obtain request:**
```bash
curl -X POST http://your-domain/auth/token/ \
     -H "Content-Type: application/json" \
     -d '{"username": "your_username", "password": "your_password"}'
```

**Example response:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## Automatic Configuration

The Authentication app automatically configures Django REST Framework settings when the app is loaded:

### REST Framework Settings

The app updates `settings.REST_FRAMEWORK` with:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        # Dynamically added based on AUTHENTICATION.TYPES:
        # 'rest_framework.authentication.TokenAuthentication',  # if "TOKEN" enabled
        # 'rest_framework_simplejwt.authentication.JWTAuthentication',  # if "JWT" enabled
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### System Checks

The app includes comprehensive system checks that validate:

- **Dependency Order**: Ensures `rest_framework`, `rest_framework.authtoken`, `rest_framework_simplejwt`, and `nside_wefa.common` are installed before `nside_wefa.authentication`
- **Required Settings**: Validates that `NSIDE_WEFA.AUTHENTICATION` is properly configured
- **Authentication Types**: Ensures all specified authentication types are valid (`TOKEN` or `JWT`)

Run Django's system checks to validate your configuration:

```bash
python manage.py check
```

## URL Configuration

The app provides dynamic URL configuration based on enabled authentication types:

```python
# If TOKEN authentication is enabled
urlpatterns += [
    path("token-auth/", obtain_auth_token, name="api-auth"),
]

# If JWT authentication is enabled  
urlpatterns += [
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
```

## Usage Examples

### Using Token Authentication

1. **Obtain a token:**
```python
import requests

response = requests.post('http://your-domain/auth/token-auth/', {
    'username': 'your_username',
    'password': 'your_password'
})
token = response.json()['token']
```

2. **Use the token in API requests:**
```python
headers = {'Authorization': f'Token {token}'}
response = requests.get('http://your-domain/api/protected-endpoint/', headers=headers)
```

### Using JWT Authentication

1. **Obtain JWT tokens:**
```python
import requests

response = requests.post('http://your-domain/auth/token/', {
    'username': 'your_username',
    'password': 'your_password'
})
tokens = response.json()
access_token = tokens['access']
refresh_token = tokens['refresh']
```

2. **Use the access token:**
```python
headers = {'Authorization': f'Bearer {access_token}'}
response = requests.get('http://your-domain/api/protected-endpoint/', headers=headers)
```

3. **Refresh the token:**
```python
refresh_response = requests.post('http://your-domain/auth/token/refresh/', {
    'refresh': refresh_token
})
new_access_token = refresh_response.json()['access']
```

## Testing

The app includes comprehensive tests covering:
- App configuration and initialization
- System checks and validation
- Settings initialization
- URL configuration
- Utility functions

Run tests with:
```bash
python manage.py test nside_wefa.authentication
```

## Requirements

- Django >= 3.2
- Django REST Framework >= 3.14.0
- djangorestframework-simplejwt >= 4.0.0 (for JWT authentication)
- Python >= 3.8

## Troubleshooting

### Common Issues

**1. ImportError or ModuleNotFoundError**
- Ensure all required apps are in INSTALLED_APPS in the correct order
- Run `python manage.py check` to validate dependencies

**2. Authentication not working**
- Verify `NSIDE_WEFA.AUTHENTICATION.TYPES` is properly configured
- Check that the authentication type is spelled correctly (`"TOKEN"` or `"JWT"`)
- Ensure you're using the correct authentication header format

**3. Missing endpoints**
- Verify the authentication URLs are included in your main `urls.py`
- Check that the desired authentication types are enabled in settings

## License

Distributed under the Apache-2.0 license alongside the rest of the WeFa project.