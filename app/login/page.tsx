"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { BarChart3, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Show error from OAuth callback
  useEffect(() => {
    if (searchParams.get("error") === "auth_callback") {
      toast.error("Authentication failed. Please try again.")
    }
  }, [searchParams])

  async function handleSocialLogin(provider: "google" | "github") {
    setIsSocialLoading(provider)

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/forecasts`,
      },
    })

    setIsSocialLoading(null)

    if (error) {
      toast.error(error.message || `Failed to sign in with ${provider}`)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please enter email and password")
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsLoading(false)

    if (error) {
      toast.error(error.message || "Failed to sign in")
      return
    }

    // Fallback: if the user was created without a profiles row (trigger missed, old data,
    // social signup race, etc.), create it now using whatever metadata is on the auth user.
    // This makes login "just work" even for previously broken accounts.
    try {
      await api.post('/api/profiles/ensure', {})
    } catch (ensureErr) {
      console.warn('Profile ensure after login failed (non-fatal):', ensureErr)
    }

    toast.success("Welcome back!")
    const redirectTo = searchParams.get("next") || "/forecasts"
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-semibold text-2xl">
            <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            ForcastNetwork
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your analyst account to create and track forecasts
              <span className="block mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                Email confirmation disabled in development
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Social login buttons - clean style */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2"
                onClick={() => handleSocialLogin("google")}
                disabled={!!isSocialLoading || isLoading}
              >
                {isSocialLoading === "google" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-lg">G</span>
                )}
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2"
                onClick={() => handleSocialLogin("github")}
                disabled={!!isSocialLoading || isLoading}
              >
                {isSocialLoading === "github" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-sm font-semibold">GH</span>
                )}
                Continue with GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !!isSocialLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-0">
            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-accent hover:underline font-medium">
                Create one for free
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
