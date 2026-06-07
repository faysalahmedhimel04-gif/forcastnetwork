import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ForecastCard } from "@/components/forecast-card"
import { FollowButton } from "@/components/follow-button"
import type { ForecastWithAnalyst } from "@/types"

interface SearchParams {
  source?: "all" | "polymarket" | "manual"
}

export default async function AnalystProfilePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ username: string }>,
  searchParams?: Promise<SearchParams>
}) {
  const { username } = await params
  const sp: SearchParams = await (searchParams || Promise.resolve({} as SearchParams))
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single()

  if (!profile) notFound()

  const isOwnProfile = currentUser?.id === profile.id

  // Check if current user follows
  let isFollowing = false
  if (currentUser && !isOwnProfile) {
    const { data: followRow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", profile.id)
      .single()
    isFollowing = !!followRow
  }

  // Get this analyst's forecasts (with optional source filter)
  let query = supabase
    .from("forecasts")
    .select(`*, profiles:user_id (username, full_name, avatar_url)`)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20)

  if (sp.source === "polymarket") {
    query = query.eq("external_source", "polymarket")
  } else if (sp.source === "manual") {
    query = query.is("external_source", null)
  }

  const { data: forecastsRaw } = await query

  const forecasts: ForecastWithAnalyst[] = (forecastsRaw || []).map((f: any) => ({
    ...f,
    analyst_username: profile.username,
    analyst_name: profile.full_name,
    analyst_avatar: profile.avatar_url,
  }))

  const openCount = forecasts.filter(f => f.status === "open").length
  const resolved = forecasts.filter(f => f.status === "resolved")
  const polymarketCount = forecasts.filter(f => f.external_source === "polymarket").length
  const activeSource = sp.source || "all"

  return (
    <div className="container max-w-5xl mx-auto px-4 py-9">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar / Profile info */}
        <div className="md:w-80 shrink-0">
          <div className="sticky top-20">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16 ring-2 ring-border">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">{(profile.full_name || profile.username).slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-2xl font-semibold tracking-tight">{profile.full_name || profile.username}</div>
                <div className="text-muted-foreground">@{profile.username}</div>
              </div>
            </div>

            {!isOwnProfile && (
              <FollowButton 
                targetUserId={profile.id} 
                initialIsFollowing={isFollowing} 
              />
            )}

            {isOwnProfile && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/profile">Edit profile</Link>
              </Button>
            )}

            {profile.bio && (
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
            )}

            <div className="mt-6 grid grid-cols-3 gap-px bg-border rounded-lg overflow-hidden text-center text-sm">
              <div className="bg-card py-3">
                <div className="font-semibold tabular-nums">{profile.accuracy.toFixed(1)}%</div>
                <div className="text-[10px] text-muted-foreground tracking-wider">ACCURACY</div>
              </div>
              <div className="bg-card py-3">
                <div className="font-semibold tabular-nums">{profile.total_forecasts}</div>
                <div className="text-[10px] text-muted-foreground tracking-wider">FORECASTS</div>
              </div>
              <div className="bg-card py-3">
                <div className="font-semibold tabular-nums">{profile.follower_count}</div>
                <div className="text-[10px] text-muted-foreground tracking-wider">FOLLOWERS</div>
              </div>
            </div>

            {profile.expertise_areas?.length > 0 && (
              <div className="mt-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Expertise</div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.expertise_areas.map((area: string) => (
                    <Badge key={area} variant="secondary">{area}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Forecasts list */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Forecasts by {profile.full_name || profile.username} <span className="text-muted-foreground font-normal">({forecasts.length})</span></h2>
              <div className="text-sm text-muted-foreground">{openCount} open • {polymarketCount} Polymarket-linked</div>
            </div>

            {/* Source filter pills (Polymarket support) */}
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground text-xs mr-1">Show:</span>
              {[
                { key: "all", label: "All" },
                { key: "manual", label: "Independent" },
                { key: "polymarket", label: "Polymarket" },
              ].map((s) => (
                <a
                  key={s.key}
                  href={`/analysts/${username}?source=${s.key}`}
                  className={`px-3 py-1 rounded-full text-xs border transition ${activeSource === s.key ? "bg-accent text-white border-accent" : "hover:bg-muted"}`}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {forecasts.length > 0 ? (
            <div className="grid gap-4">
              {forecasts.map((f) => (
                <ForecastCard key={f.id} forecast={f} showAnalyst={false} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border p-8 text-center text-muted-foreground">
              No forecasts found for this filter.
            </div>
          )}

          {resolved.length > 0 && (
            <div className="mt-8 text-xs text-muted-foreground">
              Resolved forecasts: {resolved.length} · Track record updates automatically on resolution.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
