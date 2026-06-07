import { AnalystCard } from "@/components/analyst-card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

export default async function AnalystsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)

  // Use backend for public analysts data
  const res = await fetch(`${backendUrl}/api/leaderboard?limit=48&${search.toString()}`, {
    next: { revalidate: 60 },
  })
  const { data: analystsRaw = [] } = await res.json().catch(() => ({}))

  const analysts = (analystsRaw || []).map((a: any) => ({
    ...a,
    is_following: false,
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
              currentUserId={undefined} 
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
