# MMS Backend-for-Frontend (BFF)

This component and how it integrates with the MMS architecture is described here : https://n-side.atlassian.net/l/cp/RihgYyDN

## Setting up the .env file
You need to define a bunch of environment variables in the ```bff/.env``` file. 

Use ```bff/.env.example``` as template.

From your OAuth server, you'll need :
- The Client ID and Client Secret.
The Client should be configured as a Confidential Client supporting the Authorization Flow with PKCE.
- The ```authorize```, ```token``` and ```userinfo``` endpoints

From your Frontend you'll need :
- The domain
- The ```login/callback``` endpoint

## Run locally
1. Create and fill the ```bff/.env``` file
2. Setup a Python Interpreter or Environment using your preferred method
3. Enter/activate your environment
4. ```pipenv install```
5. ```flask --app bff.py run --port <PORT>```, where ```<PORT>``` matches the PORT defined in .env

## Run with Docker
1. Create and fill the ```bff/.env``` file
2. ```docker-compose up --build```