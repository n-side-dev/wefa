from flask import Flask, request, session, jsonify, Response, redirect
from flask_cors import CORS
from authlib.integrations.requests_client import OAuth2Session
import dotenv
import os
import secrets
import requests

# Load environment variables from .env file
dotenv.load_dotenv()

# Keycloak OIDC
client_id = os.getenv("OAUTH_CLIENT_ID")
client_secret = os.getenv("OAUTH_CLIENT_SECRET")

app = Flask(__name__)

# KEY TO SIGN SESSION COOKIE
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY")

# COOKIE CONFIG
app.config["SESSION_COOKIE_NAME"] = os.getenv("SESSION_COOKIE_NAME")  # Should be __Host-...
app.config["SESSION_COOKIE_PATH"] = os.getenv("SESSION_COOKIE_PATH", "/")
app.config["SESSION_COOKIE_HTTPONLY"] = os.getenv("SESSION_COOKIE_HTTPONLY", "True") == "True"
# If true, prevents transmission of the cookie over unencrypted channels, which is not wished on development env
app.config["SESSION_COOKIE_SECURE"] = os.getenv("SESSION_COOKIE_SECURE", "True") == "True"
# There is practically no need to relax the SameSite policy, as the BFF only uses this cookie
app.config["SESSION_COOKIE_SAMESITE"] = os.getenv("SESSION_COOKIE_SAMESITE", "Strict")

# CORS CONFIG
app.config["CORS_ORIGINS"] = os.getenv("CORS_ALLOWED_ORIGIN")
cors_kwargs = {"supports_credentials": True}
if app.config["CORS_ORIGINS"]:
    cors_kwargs["origins"] = app.config["CORS_ORIGINS"]
CORS(app, **cors_kwargs)

# BACKEND CONFIG
backend_endpoint = os.getenv("BACKEND_ENDPOINT")

# OIDC scope
scope = os.getenv("OAUTH_OIDC_SCOPE")

# Keycloak OIDC endpoints
authorization_endpoint = os.getenv("OAUTH_ENDPOINT_AUTHORIZATION")
token_endpoint = os.getenv("OAUTH_ENDPOINT_TOKEN")
userinfo_endpoint = os.getenv("OAUTH_ENDPOINT_USERINFO")
logout_endpoint = os.getenv("OAUTH_ENDPOINT_LOGOUT")

# Flask login callback endpoint
redirect_uri = os.getenv("OAUTH_LOGIN_REDIRECT_URI")

# Frontend redirect after login
frontend_redirect = os.getenv("FRONTEND_REDIRECT")


# LOGIN
# Setups Confidential Client and generate PKCE Code Verifier, State and store them in the Session cookie
# Returns URL that redirects to the Auth server and starts the login there
@app.route("/proxy/api/auth/login", methods=['GET'])
def login():
    print("-> /proxy/api/auth/login")

    # Create OAuth2 Confidential Client for Authorization Flow + PKCE
    client = OAuth2Session(
        client_id,
        client_secret,
        scope=scope,
        code_challenge_method='S256',  # PKCE
        redirect_uri=redirect_uri,
    )

    # PKCE Code Verifier
    code_verifier = secrets.token_hex(64)  # 64 bytes

    # Create Authorization URL for the Auth Server, with PKCE Challenge, State, and frontend redirect
    uri, state = client.create_authorization_url(authorization_endpoint, code_verifier=code_verifier)

    # Store PKCE Code Verifier and State in Session cookie
    # TODO Encrypt them on top of signing them
    session['cv'] = code_verifier
    session['state'] = state

    # Return the Auth URL
    res = jsonify({'redirect': uri})
    return res


# LOGIN CALLBACK
# After the user has successfully Authenticated themselves on the Auth server,
# the Auth server provides an Auth Code as well as verification codes, to the frontend
# The frontend can then relay them here, so the BFF can perform the Token Exchange
# with the Auth server, and then returns the Access/Refresh/ID Tokens through the Session Cookie
@app.route("/proxy/api/auth/callback", methods=['GET'])
def login_cb():

    print("-> /proxy/api/auth/callback")

    try:
        # State check (CSRF protection)
        if "state" not in session:
            raise ValueError("State not found in cookie, cookie might be missing")
        elif "state" not in request.args:
            raise ValueError("State not found in request arguments, incorrect request")
        elif request.args["state"] != session["state"]:
            print("State mismatch")
            return redirect(frontend_redirect, code=302)
        else:
            print("State match !")

        print("Performing Code Exchange")

        # Create OAuth2 Confidential Client for Authorization Flow + PKCE
        client = OAuth2Session(
            client_id,
            client_secret,
            scope=scope,
            code_challenge_method='S256',  # PKCE
            redirect_uri=redirect_uri,
        )

        # Retrieve Code Verifier from Session cookie
        code_verifier = session["cv"]

        # Retrieve Auth Code from Auth server response
        authorization_response = request.url
        print("Authorization Code : ", authorization_response)

        # Exchange Auth Code for Tokens
        token = client.fetch_token(
            token_endpoint,
            authorization_response=authorization_response,
            code_verifier=code_verifier
        )
        # Store Tokens in Session cookie
        session["token"] = token

        # TODO Remove when no longer needed for GraphQL Codegen hack on the front
        # GraphQL Codegen hack : we need to run GraphQL Codegen on the Frontend every time there is a (breaking) change
        # on the Resource Server API. However, the schema files on the resource server are incomplete because part of the
        # API Schema is generated at runtime (i.e Relay stuff). Thus, we are forced to ping a live API, which is protected by
        # Authentication, even locally. That's why we print the Access Token here, so we can steal it to run our
        # GraphQL Codegen script
        print("ACCESS TOKEN")
        print(token['access_token'])

        # Return success message, cookie will be attached
        return redirect(frontend_redirect, code=302)

    except Exception as e:
        print(e)
        raise e


# LOGOUT
# End the Keycloak session and revokes tokens
# Clears the (BFF) session cookie, deleting the saved tokens
@app.route("/proxy/api/auth/logout", methods=['GET'])
def logout():

    print("-> /proxy/api/auth/logout")

    # Perform logout on the auth server
    requests.post(
        logout_endpoint,
        {
            "id_token_hint": session["token"]["id_token"]
        }
    )

    # Empty session
    session.clear()

    return jsonify({"message": "logout successful"})


# USERINFO from Auth Server
# This returns a json containing info about the current logged user
# Requires access token saved in session cookie
@app.route("/proxy/api/auth/userinfo", methods=["GET"])
def auth_userinfo():
    print("-> /proxy/api/auth/userinfo")

    userinfo = requests.get(
        userinfo_endpoint,
        headers={
            'Authorization': f"Bearer {session['token']['access_token']}"
        }
    )
    return userinfo.json()


# SESSION
# Checks if there is active session, by checking if the session cookie is there and still valid
@app.route("/proxy/api/auth/session", methods=['GET'])
def check_session():
    print("-> /proxy/api/auth/session")

    res = False

    # Check if we can ping userinfo on the auth server, to see if tokens are still valid
    if 'token' in session:
        userinfo = requests.get(
            userinfo_endpoint,
            headers={
                'Authorization': f"Bearer {session['token']['access_token']}"
            }
        )
        res = (userinfo.status_code == 200)
        if not res:
            refreshed = refresh_access_token()
            if refreshed:
                userinfo = requests.get(
                    userinfo_endpoint,
                    headers={
                        'Authorization': f"Bearer {session['token']['access_token']}"
                    }
                )
                res = (userinfo.status_code == 200)

    # Return
    if not res:
        session.clear()
    return jsonify({'session': res})

# Proxy REST requests to Backend
# This endpoint retrieves the Tokens stored in the Session cookie
# and attaches them to the query before proxying it to the backend
@app.route("/proxy/api/request/<path:rest_of_url>", methods=["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"])
def proxy_request(rest_of_url):

    print("-> /proxy/api/request/" + rest_of_url)

    if request.method == "OPTIONS":
        return Response(status=204)

    headers = {k: v for k, v in request.headers if k.lower() != 'host'}  # exclude 'host' header
    payload = request.get_data()

    # Attach ID token to the query
    # The POMMS Backend uses the Access Token claims (preferred_username, issuer, ...) to perform authentication
    # Not needed (and session not available) on the Preflight (OPTIONS) request
    if "token" in session and "access_token" in session["token"]:
        headers["Authorization"] = f"Bearer {session['token']['access_token']}"
    else:
        print("ACCESS TOKEN IS MISSING")

    target_url = f"{backend_endpoint.rstrip('/')}/{rest_of_url.lstrip('/')}"

    # Forward request to Backend
    def forward_request():
        return requests.request(
            method          = request.method,
            url             = target_url,
            headers         = headers,
            params          = request.args,
            data            = payload,
            allow_redirects = False,
        )

    try:
        res = forward_request()
    except requests.exceptions.RequestException as exc:
        print(f"REST proxy error: {exc}")
        return Response("Upstream connection error", status=502)

    www_authenticate = res.headers.get("www-authenticate", "")
    if res.status_code == 401 and "invalid_token" in www_authenticate:
        if refresh_access_token():
            headers["Authorization"] = f"Bearer {session['token']['access_token']}"
            try:
                res = forward_request()
            except requests.exceptions.RequestException as exc:
                print(f"REST proxy error after refresh: {exc}")
                return Response("Upstream connection error", status=502)

    # Handle Backend response
    # exclude some keys in :res response
    excluded_headers = [
        'transfer-encoding',  # causes encoding issues
        'access-control-allow-origin',  # set by flask_cors instead
    ]
    headers = [
        (k, v) for k, v in res.headers.items()
        if k.lower() not in excluded_headers
    ]
    response = Response(res.content, res.status_code, headers)

    # Relay Backend response to frontend
    return response


def refresh_access_token() -> bool:
    refresh_token = session.get("token", {}).get("refresh_token")
    if not refresh_token:
        print("REFRESH TOKEN IS MISSING")
        return False

    try:
        response = requests.post(
            token_endpoint,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": client_id,
                "client_secret": client_secret,
            },
        )
    except requests.exceptions.RequestException as exc:
        print(f"REFRESH TOKEN REQUEST FAILED: {exc}")
        return False

    if response.status_code != 200:
        print(f"REFRESH TOKEN REQUEST REJECTED: {response.status_code}")
        return False

    session["token"] = response.json()
    return True


# Ping
@app.route("/ping")
def ping():
    print("-> /ping")
    return jsonify({"message": "pong"})


if __name__ == '__main__':
    app.run()
