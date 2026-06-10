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
import { Moon, Sun, User, LogOut, Plus, BarChart3, TrendingUp, Users, Trophy, Wallet } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { toast } from "sonner"
import { ConnectKitButton } from "connectkit"
import { usePredictionStore } from "@/lib/prediction-store"
import { useAccount } from "wagmi"
import { formatCurrency } from "@/types"

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

  // Prediction market fake balance (persisted in Zustand + localStorage)
  const balance = usePredictionStore((s) => s.balance)
  const { isConnected } = useAccount()

  useEffect(() => {
    // Create Supabase client only inside effect (client-side only execution).
    // This avoids any Supabase instantiation during server prerender / static generation
    // of pages that include the Navbar in the root layout (e.g. /create).
    const supabase = createClient()

    // On hard reload from the address bar, the React state is lost.
    // We must re-read the session from cookies/storage immediately on mount.
    // This is the most reliable way to restore logged-in UI (avatar + profile buttons)
    // after a full page reload.
    async function restoreSession() {
      // First try getSession (reads from storage/cookies)
      let { data: { session } } = await supabase.auth.getSession()

      // If still no session (common on hard reload with custom proxy),
      // force a refresh from the cookies the server set.
      if (!session?.user) {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession()
        session = refreshed
      }

      if (session?.user) {
        const u = session.user
        // Set fallback immediately so UI appears without waiting for profile DB call.
        const quickFallback: UserProfile = {
          id: u.id,
          username: (u.user_metadata?.username as string) || (u.email ? u.email.split('@')[0] : 'user'),
          full_name: (u.user_metadata?.full_name as string) || null,
          avatar_url: (u.user_metadata?.avatar_url as string) || null,
        }
        setUser(quickFallback)

        // Then try to get the real profile row, or ensure it exists (via backend).
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .eq("id", u.id)
          .maybeSingle()

        if (profile) {
          setUser(profile)
        } else {
          api.post('/api/profiles/ensure', {}).catch(() => {})
        }
      } else {
        setUser(null)
      }

      setIsLoading(false)
    }

    restoreSession()

    // Listener still needed for live changes (sign out in another tab, etc.)
    // and will also fire INITIAL_SESSION (we can ignore it here since we already restored above).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          // Only react to real sign-in or refresh events here (not INITIAL_SESSION,
          // because we already handled initial restore above).
          const u = session.user
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
          }
        }
      }
    )

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
              <Trophy className="h-4.5 w-4.5 text-white" />
            </div>
            <span>ForcastNetwork</span>
            <span className="ml-1.5 text-[10px] font-mono tracking-[2px] text-accent/70 hidden lg:inline">WC 2026</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/markets" className="nav-link text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" /> Markets
            </Link>
            <Link href="/portfolio" className="nav-link text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <Wallet className="h-4 w-4" /> Portfolio
            </Link>
            <Link href="/leaderboard" className="nav-link text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" /> Leaderboard
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
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

          {/* Fake USDC Balance (from Zustand prediction market store) */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-sm font-medium wallet-pill">
            <span className="text-muted-foreground">USDC</span>
            <span className="tabular-nums text-emerald-400">
              {formatCurrency(balance)}
            </span>
          </div>

          {/* Admin Link (visible when wallet connected) */}
          {isConnected && (
            <Button asChild size="sm" variant="ghost" className="hidden md:flex gap-1.5 text-xs">
              <Link href="/admin">
                Admin
              </Link>
            </Button>
          )}

          {/* Quick Create (visible when wallet connected) */}
          {isConnected && (
            <Button asChild size="sm" variant="outline" className="hidden sm:flex gap-1.5">
              <Link href="/admin/create-market">
                <Plus className="h-4 w-4" /> New Market
              </Link>
            </Button>
          )}

          {/* === WEB3: ConnectKit Wallet Button (primary auth for prediction markets) === */}
          <div className="hidden sm:block">
            <ConnectKitButton 
              showBalance={false}
              showAvatar={true}
            />
          </div>
          {/* Mobile compact wallet button */}
          <div className="sm:hidden">
            <ConnectKitButton 
              showBalance={false}
              showAvatar={true}
            />
          </div>

          {!isLoading && (
            <>
              {user ? (
                <>
                  <Button asChild size="sm" className="hidden sm:inline-flex" variant="outline">
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
                <div className="hidden sm:flex items-center gap-2">
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
        <Link href="/markets" className="text-muted-foreground hover:text-foreground whitespace-nowrap">Markets</Link>
        <Link href="/portfolio" className="text-muted-foreground hover:text-foreground whitespace-nowrap">Portfolio</Link>
        <Link href="/leaderboard" className="text-muted-foreground hover:text-foreground whitespace-nowrap">Leaderboard</Link>
      </div>
    </nav>
  )
}
