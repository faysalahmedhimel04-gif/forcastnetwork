"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { BarChart3, Loader2 } from "lucide-react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()

    if (!email || !password || !username) {
      toast.error("Email, username and password are required")
      return
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      toast.error("Username must be 3-20 characters (letters, numbers, underscores)")
      return
    }

    setIsLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          full_name: fullName,
        },
      },
    })

    setIsLoading(false)

    if (error) {
      toast.error(error.message || "Failed to create account")
      return
    }

    if (data.user) {
      // Profile is auto-created by DB trigger. Optionally update immediately
      try {
        await supabase
          .from("profiles")
          .update({ full_name: fullName || null })
          .eq("id", data.user.id)
      } catch (_) {}

      toast.success("Account created! Welcome to ForcastNetwork.")
      router.push("/dashboard")
      router.refresh()
    }
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
            <CardTitle className="text-2xl">Create your analyst account</CardTitle>
            <CardDescription>
              Join the network of forecasters. Share predictions. Build your track record.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    placeholder="Alex Rivera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    placeholder="alex_rivera"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    required
                    disabled={isLoading}
                    pattern="[a-zA-Z0-9_]{3,20}"
                  />
                  <p className="text-[10px] text-muted-foreground">Unique, lowercase, no spaces</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
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
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create account &amp; start forecasting
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link href="/login" className="text-accent hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6 max-w-xs mx-auto">
          This is a forecasting &amp; opinion platform only. No betting, trading, or gambling features.
        </p>
      </div>
    </div>
  )
}
