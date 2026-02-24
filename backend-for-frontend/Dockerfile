# Use an official Python 3.12 image as a parent image
FROM python:3.12

# Set environment variables
ENV FLASK_APP=bff.py
ENV FLASK_RUN_HOST=0.0.0.0

# Set the working directory in the container
WORKDIR /app

# Install pipenv
RUN pip install --no-cache-dir pipenv

# Copy Pipfile and Pipfile.lock
COPY Pipfile Pipfile.lock ./

# Install dependencies from Pipfile.lock
RUN pipenv install --deploy --system --ignore-pipfile

# Copy the current directory contents into the container at /app
# Do this after installing the dependencies to avoid breaking Docker cache
COPY . /app

# Make port 5000 available to the world outside this container
ARG PORT
EXPOSE $PORT

# Run app.py when the container launches
CMD ["pipenv", "run", "flask", "--app", "bff.py", "run", "--port", "$PORT", "--debug"]
