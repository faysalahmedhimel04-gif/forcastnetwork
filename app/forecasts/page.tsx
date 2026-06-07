import { createClient } from "@/lib/supabase/server"
import { ForecastCard } from "@/components/forecast-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Search, Filter } from "lucide-react"
import type { ForecastWithAnalyst } from "@/types"
import { FORECAST_CATEGORIES } from "@/types"

interface SearchParams {
  q?: string
  category?: string
  status?: "open" | "resolved" | "all"
  source?: "all" | "polymarket" | "manual"
}

export const dynamic = 'force-dynamic'

export default async function ForecastsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("forecasts")
    .select(`
      *,
      profiles:user_id (username, full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })

  // Filters
  if (params.q) {
    const term = `%${params.q}%`
    query = query.or(`title.ilike.${term},description.ilike.${term}`)
  }
  if (params.category && params.category !== "all") {
    query = query.eq("category", params.category)
  }
  if (params.status === "open") {
    query = query.eq("status", "open")
  } else if (params.status === "resolved") {
    query = query.eq("status", "resolved")
  }
  if (params.source === "polymarket") {
    query = query.eq("external_source", "polymarket")
  } else if (params.source === "manual") {
    query = query.is("external_source", null)
  }

  const { data: forecastsRaw } = await query.limit(60)

  const forecasts: ForecastWithAnalyst[] = (forecastsRaw || []).map((f: any) => ({
    ...f,
    analyst_username: f.profiles?.username || "unknown",
    analyst_name: f.profiles?.full_name || null,
    analyst_avatar: f.profiles?.avatar_url || null,
  }))

  const activeStatus = params.status || "all"
  const activeCategory = params.category || "all"
  const activeSource = params.source || "all"

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">All Forecasts</h1>
          <p className="text-muted-foreground mt-1">Discover predictions from analysts across every domain.</p>
        </div>
        <Button asChild>
          <Link href="/create">Create new forecast</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <form className="flex-1 flex gap-2" action="/forecasts" method="GET">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              name="q" 
              placeholder="Search forecasts..." 
              defaultValue={params.q} 
              className="pl-9" 
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Status pills */}
          <div className="flex items-center rounded-md border p-1 bg-muted/50 text-sm">
            {["all", "open", "resolved"].map((s) => (
              <a
                key={s}
                href={`/forecasts?${new URLSearchParams({ 
                  ...(params.q && { q: params.q }), 
                  ...(params.category && { category: params.category }), 
                  ...(params.source && { source: params.source }), 
                  status: s 
                })}`}
                className={`px-3 py-1 rounded transition ${activeStatus === s ? "bg-background shadow font-medium" : "hover:bg-background/70"}`}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </a>
            ))}
          </div>

          {/* Source filter: All / Independent / Polymarket */}
          <div className="flex items-center rounded-md border p-1 bg-muted/50 text-sm">
            {[
              { key: "all", label: "All sources" },
              { key: "manual", label: "Independent" },
              { key: "polymarket", label: "Polymarket" },
            ].map((s) => {
              const isActive = (params.source || "all") === s.key
              return (
                <a
                  key={s.key}
                  href={`/forecasts?${new URLSearchParams({ 
                    ...(params.q && { q: params.q }), 
                    ...(params.category && { category: params.category }), 
                    status: activeStatus,
                    source: s.key 
                  })}`}
                  className={`px-3 py-1 rounded transition text-xs ${isActive ? "bg-background shadow font-medium" : "hover:bg-background/70"}`}
                >
                  {s.label}
                </a>
              )
            })}
          </div>

          {/* Category select via links */}
          <div className="flex items-center gap-1.5 text-sm flex-wrap">
            <span className="text-muted-foreground hidden md:inline pl-1">Category:</span>
            <a href={`/forecasts?${new URLSearchParams({ ...(params.q && {q: params.q}), status: activeStatus, ...(params.source && {source: params.source}) })}`} 
               className={`px-2.5 py-0.5 rounded-full text-xs border ${activeCategory === "all" ? "bg-accent text-white border-accent" : "hover:bg-muted"}`}>All</a>
            {FORECAST_CATEGORIES.map((cat) => (
              <a 
                key={cat} 
                href={`/forecasts?${new URLSearchParams({ 
                  ...(params.q && { q: params.q }), 
                  category: cat, 
                  status: activeStatus,
                  ...(params.source && { source: params.source })
                })}`}
                className={`px-2.5 py-0.5 rounded-full text-xs border ${activeCategory === cat ? "bg-accent text-white border-accent" : "hover:bg-muted"}`}
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </div>

      {forecasts.length === 0 ? (
        <div className="rounded-xl border py-16 text-center">
          <p className="text-muted-foreground">No forecasts found matching your filters.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/forecasts">Clear filters</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forecasts.map((forecast) => (
            <ForecastCard key={forecast.id} forecast={forecast} />
          ))}
        </div>
      )}

      <div className="text-center mt-10 text-xs text-muted-foreground">
        Showing latest forecasts. Use filters or search to narrow results.
      </div>
    </div>
  )
}
