import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

/**
 * Supabase session middleware.
 * 
 * Note: In Next.js 16+ you may see a deprecation warning about the "middleware" convention.
 * This file is still the recommended approach for edge-based auth session handling with Supabase SSR.
 * It runs on the Edge runtime and is required for protected routes.
 * 
 * For production deploys (Vercel, etc.) this continues to work reliably.
 * If the warning becomes blocking in a future Next.js version, the logic can be moved
 * into a root layout + server actions pattern, but the current implementation is standard and stable.
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
