# Contributing to N-SIDE WeFa

Thank you for your interest in contributing to N-SIDE WeFa!
This document provides guidelines and instructions for setting up your development environment and contributing to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [Code Standards](#code-standards)
- [Contributing Workflow](#contributing-workflow)
- [Adding New Libraries](#adding-new-libraries)
- [Documentation](#documentation)

## Development Setup

### Prerequisites

- Python >= 3.12
- UV package manager (recommended) or pip
- Git

### Local Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/n-side-dev/wefa.git
   cd wefa
   ```

2. **Set up virtual environment with UV (recommended):**
   ```bash
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

   Or with pip:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   uv sync --all-extras  # With UV
   # or
   pip install -e ".[dev]"  # With pip
   ```

4. **Set up the test Django project:**
   ```bash
   cd django
   python manage.py migrate
   ```

### Creating a Test Django Project

To test the library in a separate Django project:

1. **Create a new Django project:**
   ```bash
   mkdir test_project
   cd test_project
   django-admin startproject myproject .
   ```

2. **Install nside-wefa in development mode:**
   ```bash
   pip install -e /path/to/nside-demo
   ```

3. **Add to INSTALLED_APPS:**
   ```python
   # settings.py
   INSTALLED_APPS = [
       'django.contrib.admin',
       'django.contrib.auth',
       'django.contrib.contenttypes',
       'django.contrib.sessions',
       'django.contrib.messages',
       'django.contrib.staticfiles',
       'rest_framework',
       'rest_framework.authtoken',          # Required for Token authentication
       'rest_framework_simplejwt',          # Required for JWT authentication
       'nside_wefa.common',                 # Must come before other nside_wefa apps
       'nside_wefa.authentication',         # Add the Authentication app
       'nside_wefa.legal_consent',          # Add the LegalConsent app
   ]
   
   # Configuration
   NSIDE_WEFA = {
       'APP_NAME': 'My App',
       'AUTHENTICATION': {
         'TYPES': ['TOKEN', 'JWT'],
       },
       'LEGAL_CONSENT': {
         'VERSION': 1,
         'EXPIRY_LIMIT': 365,
       }
   }
   ```

4. **Run migrations and test:**
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

## Project Structure

```
nside-wefa/
├── nside_wefa/                 # Main package
│   ├── __init__.py
│   ├── authentication/         # Authentication configuration library
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── checks.py
│   │   ├── constants.py
│   │   ├── urls.py
│   │   ├── utils/
│   │   ├── tests/
│   │   └── README.md
│   └── legal_consent/          # Legal Consent library
│       ├── __init__.py
│       ├── models/
│       ├── views.py
│       ├── serializers.py
│       ├── urls.py
│       ├── tests/
│       └── README.md
├── pyproject.toml              # Package configuration
├── README.md                   # Main documentation
├── CONTRIBUTE.md               # This file
└── manage.py                   # Django management script (for testing)
```

## Running Tests

### Full Test Suite

Run all tests from the project root:

```bash
cd django/nside_wefa
python manage.py test
```

### Specific App Tests

Run tests for a specific app:

```bash
python manage.py test nside_wefa.authentication
python manage.py test nside_wefa.legal_consent
```

### Test Categories

Run specific test categories:

```bash
# Authentication tests
python manage.py test nside_wefa.authentication.tests
# Model tests
python manage.py test nside_wefa.legal_consent.tests.models

# View tests
python manage.py test nside_wefa.legal_consent.tests.views

# Serializer tests
python manage.py test nside_wefa.legal_consent.tests.serializers


# Migration tests
python manage.py test nside_wefa.legal_consent.tests.migrations
```

### Coverage

To run tests with coverage:

```bash
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML coverage report
```

## Code Standards

### Python Code Style

- Follow PEP 8 guidelines
- Use meaningful variable and function names
- Add docstrings to all classes and functions
- Maximum line length: 88 characters (Black formatter default)

### Django Conventions

- Follow Django's coding style
- Use Django's built-in features when possible
- Maintain backward compatibility
- Write comprehensive tests for all functionality

### Type Hints

Use type hints for all function parameters and return values:

```python
from typing import Optional
from django.contrib.auth.models import User
from nside_wefa.legal_consent.models import LegalConsent

def create_user_agreement(user: User, version: Optional[int] = None) -> LegalConsent:
    """Create a legal consent for the given user."""
    # Implementation here
```

## Contributing Workflow

### 1. Fork and Branch

1. Fork the repository on GitHub
2. Create a branch (feature/ or bugfix/ or ...):
   ```bash
   git checkout -b feature/your-feature-name
   ```

### 2. Development

1. Make your changes
2. Write or update tests
3. Update documentation if necessary
4. Ensure all tests pass

### 3. Code Quality

Run code quality checks:

```bash
# Format code
ruff format .

# Check linting
ruff check .

# Type checking
mypy nside_wefa/
```

### 4. Testing

Before submitting:

```bash
# Run full test suite
python manage.py test

# Check test coverage
coverage run --source='.' manage.py test
coverage report --fail-under=80
```

### 5. Submit Pull Request

1. Push your branch to your fork
2. Create a pull request with:
   - Clear description of changes
   - Reference to any related issues
   - Test results
   - Updated documentation

## Adding New Libraries

When adding a new library to the nside-wefa package:

### 1. Structure

Create the library structure:

```
nside_wefa/
└── your_library/
    ├── __init__.py
    ├── apps.py
    ├── models/
    ├── views.py
    ├── serializers.py
    ├── urls.py
    ├── tests/
    └── README.md
```

### 2. App Configuration

Create an `apps.py` file:

```python
from django.apps import AppConfig

class YourLibraryConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "nside_wefa.your_library"
```

### 3. Documentation

Create a comprehensive `README.md` for your library following the LegalConsent library example.

### 4. Tests

Write comprehensive tests covering:
- Model functionality
- View behavior
- Serializer validation
- Migration operations
- Integration scenarios

### 5. Update Main README

Add your library to the Libraries section in the main README.md.

## Documentation

### Code Documentation

- Add docstrings to all classes, methods, and functions
- Use reST-style docstrings (reStructuredText format)
- Include type hints
- Document complex business logic

### README Updates

When making changes:
- Update the relevant library README
- Update the main README if adding new features
- Keep examples up to date
- Update version numbers as needed

### API Documentation

For REST API endpoints:
- Use DRF's built-in schema generation
- Add comprehensive docstrings to serializers and views
- Include usage examples

## Questions and Support

If you have questions or need help:

1. Check existing issues on GitHub
2. Review the documentation
3. Create a new issue with detailed information
4. Tag maintainers if urgent

Thank you for contributing to N-SIDE WeFa!