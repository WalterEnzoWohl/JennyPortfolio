import {
  getSupabaseRequestHeaders,
  PORTFOLIO_FUNCTION_URL,
} from './supabaseClient'

const VISIT_SESSION_KEY = 'jenny-portfolio-visit-recorded-v1'

export async function recordPortfolioVisit() {
  if (window.sessionStorage.getItem(VISIT_SESSION_KEY) === 'ok') return

  try {
    const response = await fetch(PORTFOLIO_FUNCTION_URL, {
      method: 'POST',
      headers: {
        ...getSupabaseRequestHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'record-visit',
        path: window.location.pathname,
      }),
      keepalive: true,
    })

    if (response.ok) window.sessionStorage.setItem(VISIT_SESSION_KEY, 'ok')
  } catch {
    // Analytics must never block the public portfolio.
  }
}
