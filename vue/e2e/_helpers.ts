import type { Page, Route } from '@playwright/test'

/**
 * Token returned by the mocked login endpoint. Exposed so tests can pre-seed
 * localStorage to skip the login screen when they only care about
 * post-authentication flows.
 */
export const MOCK_TOKEN = 'mock-token-abc123'

/**
 * Install Playwright route handlers that emulate the Django backend the demo
 * app talks to (`http://localhost:8000`). Call this before `page.goto()` so
 * every outbound request (including the ones fired on app bootstrap) is
 * intercepted.
 *
 * Routes are consulted in LIFO order, so the broadest fallback is registered
 * first and gets evaluated last. The specific handlers cover:
 *   - `POST /authentication/token-auth/` → `{ token }` on credentials
 *     matching `{ username: 'demo', password: 'demo' }`, 400 otherwise.
 *   - `GET /locale/available/` → `{ available: ['en', 'fr'], default: 'en' }`.
 *   - `GET /locale/user/` → mirrors an internal `userLocale` state.
 *   - `PATCH /locale/user/` → updates the internal `userLocale` state.
 *   - Any other `http://localhost:8000/**` request → 204 to keep the demo
 *     responsive without wiring the whole API surface in tests.
 */
export async function mockBackend(page: Page): Promise<void> {
  let userLocale: string | null = null

  // Broad fallback first — later, more-specific routes take precedence.
  await page.route('http://localhost:8000/**', async (route: Route) => {
    await route.fulfill({ status: 204, body: '' })
  })

  await page.route('**/authentication/token-auth/**', async (route: Route) => {
    const body = route.request().postDataJSON() as { username?: string; password?: string } | null
    if (body?.username === 'demo' && body?.password === 'demo') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: MOCK_TOKEN }),
      })
      return
    }
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Invalid credentials' }),
    })
  })

  await page.route('**/locale/available/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ available: ['en', 'fr'], default: 'en' }),
    })
  })

  await page.route('**/locale/user/**', async (route: Route) => {
    const method = route.request().method()
    if (method === 'PATCH') {
      const body = route.request().postDataJSON() as { code?: string } | null
      userLocale = body?.code ?? null
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: userLocale }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: userLocale }),
    })
  })
}

/**
 * Pre-seed the auth token into localStorage so the demo boots straight into
 * the authenticated layout, bypassing the login form. Must be called *after*
 * an initial `page.goto()` so `localStorage` is available.
 * @param page Playwright page object.
 */
export async function authenticate(page: Page): Promise<void> {
  await page.evaluate((token) => {
    localStorage.setItem('authenticationToken', token)
  }, MOCK_TOKEN)
}
