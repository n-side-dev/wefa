# Use an official Python 3.12 image as a parent image
FROM python:3.12

# Set environment variables
ENV FLASK_APP=bff.py
ENV FLASK_RUN_HOST=0.0.0.0

# Set the working directory in the container
WORKDIR /app

# Install uv
RUN pip install --no-cache-dir uv

# Copy dependency metadata first for cache-friendly installs
COPY pyproject.toml uv.lock ./

# Install dependencies from uv.lock (without dev dependencies)
RUN uv sync --frozen --no-dev --no-install-project

# Copy the current directory contents into the container at /app
# Do this after installing the dependencies to avoid breaking Docker cache
COPY . /app

# Make the exposed container port explicit; runtime mapping can still override host port
ARG PORT=5000
EXPOSE ${PORT}

# Run app.py when the container launches
CMD ["sh", "-c", "uv run flask --app bff.py run --host 0.0.0.0 --port ${PORT:-5000}"]
