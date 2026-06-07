import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/session"

/**
 * Next.js Proxy (formerly called Middleware) for Supabase session handling.
 *
 * This runs on the Edge and is responsible for:
 * - Refreshing Supabase auth cookies for SSR
 * - Redirecting unauthenticated users away from protected routes (/dashboard, /create, /profile)
 *
 * We migrated from the deprecated `middleware.ts` convention to `proxy.ts` per Next.js 16+ guidance.
 * The internal session logic lives in lib/supabase/session.ts.
 *
 * The matcher excludes static assets, images, and public files.
 */
export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request)
  } catch (error) {
    // Safety net so a Supabase client or env issue never causes a hard 500 at the edge.
    console.error('[Proxy] Session update error (continuing request):', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
