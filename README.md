# N-SIDE WeFa (Web Factory)

[![security: bandit](https://img.shields.io/badge/security-bandit-yellow.svg)](https://github.com/PyCQA/bandit)
[![Release](https://github.com/n-side-dev/wefa/actions/workflows/release.yml/badge.svg)](https://github.com/n-side-dev/wefa/actions/workflows/release.yml)
[![GitHub Releases](https://img.shields.io/github/v/release/n-side-dev/wefa?include_prereleases&label=latest%20release)](https://github.com/n-side-dev/wefa/releases)
[![npm version](https://img.shields.io/npm/v/%40nside/wefa)](https://www.npmjs.com/package/@nside/wefa)
[![PyPI version](https://img.shields.io/pypi/v/nside-wefa)](https://pypi.org/project/nside-wefa/)
[![License](https://img.shields.io/github/license/n-side-dev/wefa)](https://github.com/n-side-dev/wefa/blob/main/LICENSE)

N-SIDE WeFa (Web Factory) is an open-source toolkit for building full-stack, product-ready web experiences. It brings together:

- **WeFa Django Toolkit** – reusable Django apps for authentication, consent management, and shared utilities (`django/`)
- **WeFa Frontend Library** – a Vue 3 component system, CLI helpers, and Storybook demos (`vue/`)

## Packages at a Glance

- `django/` – source code for the Django distribution published as `nside-wefa`. Includes the demo project in `django/demo`.
- `vue/` – source code for the Vue library published as `@nside/wefa`, plus a demo/Storybook playground.
- `utils/`, `scripts/`, etc. – helper modules shared inside their respective workspaces.

Each package comes with its own README describing features and local workflows plus a CONTRIBUTE if you want to support the development of this project.

## Quick Start

### Backend (Django)

```bash
pip install nside-wefa
```

```python
INSTALLED_APPS = [
    # ...your apps
    "nside_wefa.common",
    "nside_wefa.authentication",
    "nside_wefa.legal_consent",
]
```

Check the [Django README](django/README.md) for configuration examples, migrations, and development commands.

### Frontend (Vue)

```bash
npm install @nside/wefa
```

```ts
import { WefaButton } from "@nside/wefa";
import "@nside/wefa/style";
```

See the [Vue README](vue/README.md) for build scripts, Storybook, and component authoring guidelines.

## Local Development

- **Backend** – `cd django`, create a virtual environment (or use [uv](https://github.com/astral-sh/uv)), install dependencies (`pip install -e .[dev]`), then run `python manage.py migrate` and `pytest`.
- **Frontend** – `cd vue`, run `npm install`, then use `npm run dev` for the demo playground or `npm run storybook` for docs.

The demo apps in both workspaces illustrate how to compose the packages together.

## Contributing

Contributions are welcome! Start with open issues or propose new ideas through GitHub discussions. Please read [Django CONTRIBUTE](django/CONTRIBUTE.md) and/or [Vue CONTRIBUTE](vue/CONTRIBUTE.md) for the current contribution workflow.

Before opening a pull request:

- follow the linting and testing commands documented in each package
- document new features or breaking changes in the relevant README or package CHANGELOG (when available)

## License

WeFa is released under the Apache-2.0 license.

## Project Status

The project is in active development and still stabilising APIs. While the development team will try to avoid as much as possible, breaking changes may occur with the addition of new features.

**Developed by N-Side** - [Website](https://n-side.com) | [GitHub](https://github.com/n-side-dev)
