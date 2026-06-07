import { createBrowserClient } from "@supabase/ssr"

/**
 * Safe Supabase browser client.
 * 
 * Prevents crashes during server-side rendering / static prerender (e.g. of error pages
 * or layouts that include client components like Navbar) when env vars are not present
 * at build time.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase Client] Missing env vars - using dummy client for prerender/SSR')
    // Return a minimal mock that satisfies the usage in Navbar and other client components
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
      }),
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
