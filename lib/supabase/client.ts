import { createBrowserClient } from "@supabase/ssr"

/**
 * Safe Supabase browser client.
 * 
 * Prevents crashes during server-side rendering / static prerender (e.g. of error pages
 * or layouts that include client components like Navbar) when env vars are not present
 * at build time.
 *
 * Includes a robust chainable dummy + try/catch so that even if createBrowserClient
 * is reached with bad values during Vercel/Next.js prerender, we fall back gracefully.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase Client] Missing env vars - using dummy client for prerender/SSR')
    return createDummyClient()
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (err) {
    console.warn('[Supabase Client] createBrowserClient threw, using dummy for prerender/SSR', err)
    return createDummyClient()
  }
}

function createDummyClient() {
  const noOp = () => Promise.resolve({ data: [], error: null })
  const singleNoOp = () => Promise.resolve({ data: null, error: null })

  // Full chainable builder so .from().select().eq().single() etc. never explode
  const chainable: any = {
    select: () => chainable,
    insert: noOp,
    update: noOp,
    delete: noOp,
    eq: () => chainable,
    neq: () => chainable,
    gt: () => chainable,
    gte: () => chainable,
    lt: () => chainable,
    lte: () => chainable,
    like: () => chainable,
    ilike: () => chainable,
    is: () => chainable,
    in: () => chainable,
    order: () => chainable,
    limit: () => chainable,
    range: () => chainable,
    single: singleNoOp,
    maybeSingle: singleNoOp,
    then: (resolve: any) => resolve({ data: [], error: null }),
  }

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
    },
    from: () => chainable,
  } as any
}
