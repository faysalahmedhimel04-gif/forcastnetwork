import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Safe Supabase server client.
 * 
 * Prevents build failures when Supabase env vars are not present during
 * static prerendering (especially /_not-found and other error pages).
 * 
 * If env vars are missing, returns a dummy client that safely no-ops all calls.
 * This allows `npm run build` to succeed even without the vars at build time.
 * 
 * In production, set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * in your hosting provider (Vercel etc.).
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Dummy client - completely safe for static prerender / build time
    console.warn('[Supabase] Missing env vars - using dummy client for prerender/build')

    const noOp = () => Promise.resolve({ data: [], error: null })
    const chainable = {
      select: () => chainable,
      insert: noOp,
      update: noOp,
      delete: noOp,
      eq: () => chainable,
      order: () => chainable,
      limit: () => chainable,
      single: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: [], error: null }),
    }

    return {
      from: () => chainable,
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    } as any
  }

  const cookieStore = await cookies()

  try {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Called from Server Component - safe to ignore
          }
        },
      },
    })
  } catch (err) {
    // Ultimate fallback if the library still throws (e.g. during static prerender of error pages)
    console.warn('[Supabase] createServerClient threw, using dummy for prerender/build')
    const noOp = () => Promise.resolve({ data: [], error: null })
    const chainable = {
      select: () => chainable,
      insert: noOp,
      update: noOp,
      delete: noOp,
      eq: () => chainable,
      order: () => chainable,
      limit: () => chainable,
      single: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: [], error: null }),
    }
    return {
      from: () => chainable,
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    } as any
  }
}
