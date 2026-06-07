import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build or if env vars not set (e.g. in some Vercel preview contexts),
    // skip Supabase session handling to avoid crashes.
    // In production, ensure the vars are set in Vercel dashboard.
    console.warn('[Supabase Session] Missing env vars, skipping session update')
    return supabaseResponse
  }

  // Extra validation to prevent library error with malformed URL (e.g. with /rest/v1/ appended by mistake)
  if (!supabaseUrl.startsWith('http') || supabaseUrl.includes('/rest/v1')) {
    console.error('[Supabase Session] Invalid SUPABASE_URL - must be base project URL like https://xxx.supabase.co (no /rest/v1/)')
    return supabaseResponse
  }

  // Basic validation to catch malformed URLs (e.g. with /rest/v1/ appended)
  if (!supabaseUrl.includes('supabase.co') || supabaseUrl.includes('/rest/v1')) {
    console.error('[Supabase Session] Invalid SUPABASE_URL format. It should be the base project URL like https://xxx.supabase.co (without /rest/v1/)')
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const protectedRoutes = ["/dashboard", "/create", "/profile"]
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (!user && isProtectedRoute) {
    // no user, potentially respond by redirecting to login
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // If user is logged in and tries to access auth pages, redirect to dashboard
  const authRoutes = ["/login", "/signup"]
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
