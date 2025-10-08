#!/bin/bash

# Stops and destroys the dev docker container

docker-compose -f ./docker-compose-dev.yml down
