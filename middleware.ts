import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

/**
 * Supabase session middleware (required for protecting routes like /dashboard, /create, /profile).
 * 
 * NOTE on deprecation warning in Next.js 16+ (Turbopack):
 * The root `middleware.ts` convention may show a deprecation warning suggesting "proxy".
 * This is informational for general use cases. For Supabase SSR auth (session management + protected routes),
 * keeping middleware.ts at the root is still the standard and recommended pattern used by the official
 * Supabase + Next.js examples.
 * 
 * The warning does not affect functionality or production builds. If it becomes a hard error in a future
 * Next.js version, we can migrate auth checks to middleware using the updated proxy config or move
 * user checks into server components/layouts + server actions.
 * 
 * Current matcher protects all routes except static assets.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
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
