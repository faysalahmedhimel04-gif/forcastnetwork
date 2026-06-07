/**
 * Frontend API client for calling the separate backend.
 * 
 * Usage:
 * - The frontend still uses Supabase directly for authentication (sign in, sign up, getSession).
 * - For all data operations (create forecast, comments, follows, etc.), use this client.
 * - It automatically attaches the user's Supabase access token.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

/**
 * Get the current Supabase access token from the client-side session.
 * Call this from client components or after getting session server-side.
 */
export async function getAccessToken(): Promise<string | null> {
  // This works if you import { createClient } from '@/lib/supabase/client' in client components
  // For server components/actions, pass the token explicitly.
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

/**
 * Make an authenticated request to the backend.
 * Automatically includes Authorization header when token is available.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || `API error: ${res.status}`)
  }

  return res.json()
}

/**
 * Convenience methods
 */
export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint),
  post: <T>(endpoint: string, body: any) =>
    apiFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: any) =>
    apiFetch<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: 'DELETE' }),
}
