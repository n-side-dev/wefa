"""Healthcheck routes."""

from __future__ import annotations

from flask import current_app, jsonify
from flask_smorest import Blueprint

health_bp = Blueprint(
    "health",
    __name__,
    description="Healthcheck endpoints.",
)


@health_bp.route("/ping", methods=["GET"])
@health_bp.doc(
    summary="Health check",
    description="Return a basic healthcheck response.",
    responses={
        "200": {
            "description": "Pong response.",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {"message": {"type": "string"}},
                        "required": ["message"],
                    }
                }
            },
        }
    },
)
def ping():
    """Return a basic healthcheck response.

    :returns: ``{"message": "pong"}``.
    :rtype: flask.Response
    """
    current_app.logger.debug("Handling /ping")
    return jsonify({"message": "pong"})
