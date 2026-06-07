import { createClient } from "@/lib/supabase/server"
import { AnalystCard } from "@/components/analyst-card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AnalystsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from("profiles")
    .select("*")
    .order("follower_count", { ascending: false })
    .order("accuracy", { ascending: false })
    .limit(48)

  if (params.q) {
    const term = `%${params.q}%`
    query = query.or(`username.ilike.${term},full_name.ilike.${term},bio.ilike.${term}`)
  }

  const { data: analystsRaw } = await query

  // Fetch who current user follows (to show following state)
  let followedSet = new Set<string>()
  if (user) {
    const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id)
    followedSet = new Set((follows || []).map((f: any) => f.following_id))
  }

  const analysts = (analystsRaw || []).map((a: any) => ({
    ...a,
    is_following: followedSet.has(a.id),
  }))

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Analysts</h1>
          <p className="text-muted-foreground">Discover forecasters and follow their work</p>
        </div>
        <form action="/analysts" className="flex gap-2 w-full md:w-auto">
          <Input name="q" placeholder="Search analysts by name or bio..." defaultValue={params.q} className="md:w-80" />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </div>

      {analysts.length === 0 ? (
        <div className="text-center py-12 border rounded-xl">No analysts found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {analysts.map((analyst: any) => (
            <AnalystCard 
              key={analyst.id} 
              analyst={analyst} 
              onFollowToggle={undefined} 
              currentUserId={user?.id} 
            />
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/leaderboard" className="text-sm underline text-muted-foreground hover:text-foreground">See full accuracy leaderboard →</Link>
      </div>
    </div>
  )
}
