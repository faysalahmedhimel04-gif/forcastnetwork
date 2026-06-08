"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { AuthChangeEvent, Session, User as SupabaseUser } from "@supabase/supabase-js"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Moon, Sun, User, LogOut, Plus, BarChart3, TrendingUp, Users } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

interface UserProfile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
}

export function Navbar() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // Create Supabase client only inside effect (client-side only execution).
    // This avoids any Supabase instantiation during server prerender / static generation
    // of pages that include the Navbar in the root layout (e.g. /create).
    const supabase = createClient()

    async function getUser() {
      // Use getSession for faster/more reliable client-side detection after login redirect.
      // getUser() does extra validation which can sometimes lag right after signIn.
      const { data: { session } } = await supabase.auth.getSession()
      const authUser = session?.user

      if (authUser) {
        // Immediately set a fallback so the logged-in UI (avatar, dropdown, "New Forecast" etc.)
        // never disappears even if the profiles row isn't ready yet.
        const quickFallback: UserProfile = {
          id: authUser.id,
          username: (authUser.user_metadata?.username as string) ||
                    (authUser.email ? authUser.email.split('@')[0] : 'user'),
          full_name: (authUser.user_metadata?.full_name as string) || null,
          avatar_url: (authUser.user_metadata?.avatar_url as string) || null,
        }
        setUser(quickFallback)

        // Now try to load the real profile data (for accurate name/avatar)
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .eq("id", authUser.id)
          .maybeSingle()

        if (profile) {
          setUser(profile)
        } else {
          // Profile still missing — ensure it in the background (backend will create it)
          api.post('/api/profiles/ensure', {}).catch(() => {})
          // Keep the quickFallback so the user menu stays visible
        }
      }
      setIsLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        const u = session.user
        // Set quick fallback immediately so UI (avatar + profile buttons) stays visible
        const quickFallback: UserProfile = {
          id: u.id,
          username: (u.user_metadata?.username as string) || (u.email ? u.email.split('@')[0] : 'user'),
          full_name: (u.user_metadata?.full_name as string) || null,
          avatar_url: (u.user_metadata?.avatar_url as string) || null,
        }
        setUser(quickFallback)

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .eq("id", u.id)
          .maybeSingle()

        if (profile) {
          setUser(profile)
        } else {
          api.post('/api/profiles/ensure', {}).catch(() => {})
          // keep quickFallback
        }
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // run once on mount (client only)

  async function handleSignOut() {
    // Create client locally - this only ever runs in the browser after hydration
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Failed to sign out")
    } else {
      setUser(null)
      window.location.href = "/"
      toast.success("Signed out successfully")
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-semibold text-xl tracking-tight">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <BarChart3 className="h-4.5 w-4.5 text-white" />
            </div>
            <span>ForcastNetwork</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/forecasts" className="nav-link text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> Forecasts
            </Link>
            <Link href="/leaderboard" className="nav-link text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" /> Leaderboard
            </Link>
            <Link href="/analysts" className="nav-link text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <Users className="h-4 w-4" /> Analysts
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {!isLoading && (
            <>
              {user ? (
                <>
                  <Button asChild size="sm" className="hidden sm:inline-flex">
                    <Link href="/create">
                      <Plus className="h-4 w-4 mr-1.5" /> New Forecast
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-accent/10 text-accent">
                            {(user.full_name || user.username || "U").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.full_name || user.username}</span>
                          <span className="text-xs text-muted-foreground">@{user.username}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" /> Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" /> Edit Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/create" className="cursor-pointer sm:hidden">
                          <Plus className="mr-2 h-4 w-4" /> New Forecast
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/signup">Join Free</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t px-4 py-2 flex gap-4 text-sm overflow-x-auto">
        <Link href="/forecasts" className="text-muted-foreground hover:text-foreground whitespace-nowrap">Forecasts</Link>
        <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground whitespace-nowrap">Leaderboard</Link>
        <Link href="/analysts" className="text-muted-foreground hover:text-foreground whitespace-nowrap">Analysts</Link>
      </div>
    </nav>
  )
}
