import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Safe Supabase server client creation.
 * During static prerender (e.g. _not-found, build time) the env vars may not be present.
 * We provide a dummy client in that case to prevent build crashes.
 * In production/runtime, the real env vars from Vercel must be set.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Dummy client for static generation / build time
    return {
      from() {
        return {
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: null, error: null }),
          update: () => Promise.resolve({ data: null, error: null }),
          delete: () => Promise.resolve({ data: null, error: null }),
          eq: function () { return this },
          order: function () { return this },
          limit: function () { return this },
          single: () => Promise.resolve({ data: null, error: null }),
        }
      },
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
    } as any
  }

  const cookieStore = await cookies()

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
