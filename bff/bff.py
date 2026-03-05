"""Application entrypoint for the Backend-for-Frontend service.

This module loads environment variables and builds the Flask app via
the application factory.
"""

import dotenv

from bff_app import create_app
from bff_app.settings import load_settings_from_env

dotenv.load_dotenv()

settings = load_settings_from_env()
app = create_app(settings=settings)


if __name__ == "__main__":
    app.run()
