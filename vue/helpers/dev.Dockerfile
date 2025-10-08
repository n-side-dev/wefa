# Use the desired Node.js base image
ARG NODE_IMAGE
FROM node:$NODE_IMAGE

# Install bash because Alpine doesn't ship it
RUN apk update && apk add bash

# Create and move to 'app' directory in the image
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies
RUN npm install && npm cache clean --force
ENV PATH=/app/node_modules/.bin:$PATH

# Copy everything to image, ignoring what is specified in the .dockerignore
# The important thing NOT to copy is the node_modules dir
COPY ./ ./

# Run the app with the development server
ENTRYPOINT exec ./helpers/launch_local_dev.sh
