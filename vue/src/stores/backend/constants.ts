/**
 * A constant variable used as the key for storing and retrieving the authentication token
 * in the browser's localStorage. This key is utilized to maintain user session or
 * authentication state across browser sessions by securely saving the token locally.
 */
export const localStorageKey = 'authenticationToken'

/**
 * Constants used as keys for storing and retrieving JWT authentication tokens
 * in the browser's localStorage. These keys are utilized to maintain user session or
 * authentication state across browser sessions by securely saving the tokens locally.
 */
export const jwtAccessTokenKey = 'jwtAccessToken'
export const jwtRefreshTokenKey = 'jwtRefreshToken'

export const tokenLoginEndpoint = '/api/token-auth/'
export const jwtLoginEndpoint = '/api/token/'
export const jwtRefreshEndpoint = '/api/token/refresh/'

export const oauthLoginEndpoint = '/proxy/api/auth/login'
export const oauthLogoutEndpoint = '/proxy/api/auth/logout'
export const oauthSessionEndpoint = '/proxy/api/auth/session'
