import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import type { LeaderboardEntry } from "@/types"

// Force dynamic: we fetch from the backend API (and some direct Supabase for badges).
// Prevents build failures when NEXT_PUBLIC_BACKEND_URL or Supabase vars are not yet set.
export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = await createClient()

  // Use the dedicated backend for leaderboard data
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
  const res = await fetch(`${backendUrl}/api/leaderboard?limit=100`, {
    next: { revalidate: 60 }, // cache for 1 minute
  })
  const { data: entries = [] } = await res.json()

  const leaderboard: LeaderboardEntry[] = entries || []

  // Fetch set of analysts who have at least one Polymarket-linked forecast (for badges)
  const { data: linked } = await supabase
    .from("forecasts")
    .select("user_id")
    .eq("external_source", "polymarket")
    .limit(500)

  const hasPolymarket = new Set((linked || []).map((l: any) => l.user_id))

  return (
    <div className="container max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">Accuracy Leaderboard</h1>
        <p className="text-muted-foreground mt-2 max-w-prose">
          Ranked by historical accuracy on resolved forecasts. Only analysts with at least one resolved forecast appear.
          Minimum 3 forecasts for the official view.
        </p>
      </div>

      <div className="rounded-xl border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/60 text-left">
                <th className="py-3 px-5 font-medium w-12">#</th>
                <th className="py-3 px-2 font-medium">Analyst</th>
                <th className="py-3 px-4 font-medium text-right">Accuracy</th>
                <th className="py-3 px-4 font-medium text-right">Resolved</th>
                <th className="py-3 px-4 font-medium text-right hidden sm:table-cell">Followers</th>
                <th className="py-3 px-5 font-medium">Expertise</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaderboard.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No analysts with resolved forecasts yet.</td></tr>
              )}
              {leaderboard.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-muted/30">
                  <td className="py-3 px-5 tabular-nums text-muted-foreground">{index + 1}</td>
                  <td className="py-3 px-2">
                    <Link href={`/analysts/${entry.username}`} className="flex items-center gap-3 group">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.avatar_url || undefined} />
                        <AvatarFallback>{(entry.full_name || entry.username).slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium group-hover:text-accent transition-colors">{entry.full_name || entry.username}</span>
                          {hasPolymarket.has(entry.id) && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/40 text-amber-600 dark:text-amber-400">Polymarket</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">@{entry.username}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-lg tabular-nums tracking-tight">{entry.accuracy.toFixed(1)}<span className="text-xs font-normal text-muted-foreground">%</span></span>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">
                    {entry.correct_forecasts} / {entry.total_forecasts}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                    {entry.follower_count}
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex flex-wrap gap-1">
                      {entry.expertise_areas?.slice(0, 3).map((e: string) => (
                        <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">Accuracy = correct resolved forecasts ÷ total resolved forecasts. Only resolved forecasts count.</p>
    </div>
  )
}
