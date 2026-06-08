import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ForecastCard } from "@/components/forecast-card"
import { AnalystCard } from "@/components/analyst-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import type { ForecastWithAnalyst, Profile } from "@/types"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-10">Please log in.</div>
  }

  // Current user profile + stats
  // Use maybeSingle so a missing profile row (buggy previous signup) does not throw.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  // My forecasts
  const { data: myForecastsRaw } = await supabase
    .from("forecasts")
    .select(`*, profiles:user_id (username, full_name, avatar_url)`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8)

  const myForecasts: ForecastWithAnalyst[] = (myForecastsRaw || []).map((f: any) => ({
    ...f,
    analyst_username: f.profiles?.username || "",
    analyst_name: f.profiles?.full_name,
    analyst_avatar: f.profiles?.avatar_url,
  }))

  const myPolymarketLinked = myForecasts.filter(f => f.external_source === "polymarket").length

  // Followed analysts' latest open forecasts
  const { data: followed } = await supabase
    .from("follows")
    .select("following_id, profiles:following_id (id, username, full_name, avatar_url, accuracy, total_forecasts, follower_count, expertise_areas)")
    .eq("follower_id", user.id)

  const followingIds = (followed || []).map((f: any) => f.following_id)

  let followedForecasts: ForecastWithAnalyst[] = []
  if (followingIds.length > 0) {
    const { data: ff } = await supabase
      .from("forecasts")
      .select(`*, profiles:user_id (username, full_name, avatar_url)`)
      .in("user_id", followingIds)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(6)

    followedForecasts = (ff || []).map((f: any) => ({
      ...f,
      analyst_username: f.profiles?.username || "",
      analyst_name: f.profiles?.full_name,
      analyst_avatar: f.profiles?.avatar_url,
    }))
  }

  const followingProfiles: Profile[] = (followed || []).map((f: any) => f.profiles).filter(Boolean)

  const accuracy = profile?.accuracy ?? 0
  const total = profile?.total_forecasts ?? 0

  return (
    <div className="container max-w-7xl mx-auto px-4 py-9">
      {!profile && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Your profile record was not created automatically. <Link href="/profile" className="underline font-medium">Complete your profile</Link> now so your forecasts and follows work correctly.
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-y-3 mb-9">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {profile?.full_name || profile?.username || "forecaster"}</h1>
          <p className="text-muted-foreground">Your personal forecasting command center</p>
        </div>
        <Button asChild>
          <Link href="/create"><Plus className="h-4 w-4 mr-1.5" /> New forecast</Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Your accuracy</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-semibold tabular-nums tracking-tighter">{accuracy.toFixed(1)}<span className="text-xl align-super font-normal">%</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Forecasts made</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-semibold tabular-nums tracking-tighter">{total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Correct calls</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-semibold tabular-nums tracking-tighter">{profile?.correct_forecasts || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Followers</CardTitle></CardHeader>
          <CardContent><div className="text-4xl font-semibold tabular-nums tracking-tighter">{profile?.follower_count || 0}</div></CardContent>
        </Card>
      </div>

      {/* My forecasts */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your forecasts {myPolymarketLinked > 0 && <span className="text-xs font-normal text-amber-600 dark:text-amber-400">({myPolymarketLinked} linked to Polymarket)</span>}</h2>
          <Link href="/forecasts" className="text-sm text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        {myForecasts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myForecasts.map((f) => <ForecastCard key={f.id} forecast={f} showAnalyst={false} />)}
          </div>
        ) : (
          <div className="border rounded-xl p-9 text-center text-muted-foreground bg-card">
            You haven&apos;t created any forecasts yet. <Link href="/create" className="text-accent underline">Create your first one</Link>.
          </div>
        )}
        {myPolymarketLinked > 0 && (
          <p className="text-xs text-muted-foreground mt-2">Polymarket-linked forecasts include a reference market price at the time you published them.</p>
        )}
      </div>

      {/* Followed analysts forecasts */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Latest from people you follow</h2>
          {followingProfiles.length > 0 && <Link href="/analysts" className="text-sm text-muted-foreground hover:text-foreground">Discover more analysts →</Link>}
        </div>
        {followedForecasts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {followedForecasts.map((f) => <ForecastCard key={f.id} forecast={f} />)}
          </div>
        ) : (
          <div className="border rounded-xl p-9 text-center text-muted-foreground bg-card">
            Follow analysts to see their latest open forecasts here.
          </div>
        )}
      </div>

      {/* Following list */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Analysts you follow ({followingProfiles.length})</h2>
        {followingProfiles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {followingProfiles.map((a) => (
              <AnalystCard key={a.id} analyst={a as any} currentUserId={user.id} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">You aren&apos;t following anyone yet. Visit the <Link href="/analysts" className="underline">Analysts page</Link> to discover forecasters.</p>
        )}
      </div>
    </div>
  )
}
