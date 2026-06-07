import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ForecastCard } from "@/components/forecast-card"
import { AnalystCard } from "@/components/analyst-card"
import { getTrendingPolymarketMarkets } from "@/lib/polymarket"
import { ArrowRight, Target, Users, TrendingUp, Award, Shield, ExternalLink } from "lucide-react"
import type { ForecastWithAnalyst, Profile } from "@/types"

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

  // Use the dedicated backend for data (avoids direct Supabase server client in static prerender paths)
  const [trendingRes, leaderboardRes] = await Promise.all([
    fetch(`${backendUrl}/api/forecasts?status=open&limit=6`, { next: { revalidate: 60 } }),
    fetch(`${backendUrl}/api/leaderboard?limit=4`, { next: { revalidate: 60 } }),
  ])

  const trendingData = await trendingRes.json()
  const leaderboardData = await leaderboardRes.json()

  const trendingForecasts: ForecastWithAnalyst[] = (trendingData.data || []).map((f: any) => ({
    ...f,
    analyst_username: f.profiles?.username || "",
    analyst_name: f.profiles?.full_name || null,
    analyst_avatar: f.profiles?.avatar_url || null,
  }))

  const topAnalysts = leaderboardData.data || []

  // Trending Polymarket events (reference only)
  const polymarketEvents = await getTrendingPolymarketMarkets(6)

  const features = [
    {
      icon: Target,
      title: "Make Clear Forecasts",
      desc: "Write specific, time-bound predictions with confidence levels. Track every claim you make.",
    },
    {
      icon: Award,
      title: "Build a Track Record",
      desc: "Every forecast is timestamped. When resolved, your accuracy is permanently recorded on your profile.",
    },
    {
      icon: Users,
      title: "Follow Top Analysts",
      desc: "Subscribe to forecasters whose domains you care about. See their latest predictions in your feed.",
    },
    {
      icon: TrendingUp,
      title: "Public Leaderboard",
      desc: "Transparent accuracy rankings. No hidden scores. The best forecasters rise to the top.",
    },
    {
      icon: Shield,
      title: "No Markets. No Betting.",
      desc: "This is purely an expert opinion and forecasting platform. Pure signal, zero noise from gambling mechanics.",
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative border-b bg-gradient-to-b from-background to-muted/30 pt-16 pb-20">
        <div className="container px-4 mx-auto max-w-5xl text-center">
          <Badge className="mb-4 bg-accent/10 text-accent border-accent/20" variant="outline">
            Professional Forecasting Platform
          </Badge>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter mb-6">
            Make forecasts.<br />Build credibility.
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-10">
            ForcastNetwork is the home for analysts and forecasters who want their predictions 
            recorded, measured, and respected. No betting. No trading. Just expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="h-12 px-8 text-base">
              <Link href="/signup">Start forecasting for free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
              <Link href="/forecasts">Browse forecasts</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Free forever for analysts. No credit card required.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b py-5 bg-muted/40">
        <div className="container max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-y-6 text-center text-sm">
          <div>
            <div className="font-semibold text-2xl tabular-nums tracking-tight">12k+</div>
            <div className="text-muted-foreground">Forecasts made</div>
          </div>
          <div>
            <div className="font-semibold text-2xl tabular-nums tracking-tight">3.2k</div>
            <div className="text-muted-foreground">Active forecasters</div>
          </div>
          <div>
            <div className="font-semibold text-2xl tabular-nums tracking-tight">71%</div>
            <div className="text-muted-foreground">Avg. top-100 accuracy</div>
          </div>
          <div>
            <div className="font-semibold text-2xl tabular-nums tracking-tight">98k</div>
            <div className="text-muted-foreground">Comments &amp; discussions</div>
          </div>
        </div>
      </section>

      {/* Trending forecasts */}
      {trendingForecasts.length > 0 && (
        <section className="py-16 border-b">
          <div className="container px-4 mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="uppercase tracking-[2px] text-xs text-accent font-medium mb-1">HOT RIGHT NOW</div>
                <h2 className="text-3xl font-semibold tracking-tight">Trending Forecasts</h2>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/forecasts" className="gap-1">View all <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trendingForecasts.map((f) => (
                <ForecastCard key={f.id} forecast={f} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Polymarket Events (reference / context only) */}
      {polymarketEvents.length > 0 && (
        <section className="py-16 border-b bg-muted/20">
          <div className="container px-4 mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="uppercase tracking-[2px] text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">REAL-WORLD EVENTS</div>
                <h2 className="text-3xl font-semibold tracking-tight">Trending Polymarket Events</h2>
                <p className="text-sm text-muted-foreground mt-1">Popular markets for reference. Create your own forecast anchored to these events.</p>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/create" className="gap-1">Create forecast on an event <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {polymarketEvents.map((m) => (
                <Card key={m.id} className="border-amber-500/20 hover:border-amber-500/40 transition">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Badge variant="outline" className="mb-2 text-amber-600 border-amber-500/40">Polymarket</Badge>
                        <h3 className="font-semibold leading-tight text-[15px] line-clamp-3">{m.question}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-semibold tabular-nums tracking-tighter">{(m.lastTradePrice ?? 0).toFixed(2)}</div>
                        <div className="text-[10px] text-muted-foreground -mt-1">price</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs">
                      <div className="text-muted-foreground">
                        {m.volume ? `$${(m.volume / 1_000_000).toFixed(1)}M vol` : "—"}
                      </div>
                      <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                        <Link href={`/create?link=polymarket:${m.slug}`}>
                          Forecast on this <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-3 text-[11px] text-muted-foreground">
              Prices shown are from Polymarket (public data). Linking a forecast to an event is for transparency and does not involve trading or betting.
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-20 bg-muted/30 border-b">
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-semibold tracking-tight mb-3">Built for serious forecasters</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Everything you need to publish predictions, demonstrate skill, and be discovered.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-0 shadow-none bg-background">
                <CardContent className="pt-6">
                  <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                    <feature.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2 text-lg">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-[15px]">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Top Analysts */}
      {topAnalysts && topAnalysts.length > 0 && (
        <section className="py-16">
          <div className="container px-4 mx-auto max-w-7xl">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="uppercase tracking-[2px] text-xs text-accent font-medium mb-1">RECOGNIZED EXPERTS</div>
                <h2 className="text-3xl font-semibold tracking-tight">Top Analysts</h2>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/leaderboard">Full leaderboard <ArrowRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {topAnalysts.map((analyst: any) => (
                <AnalystCard key={analyst.id} analyst={analyst} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 border-t bg-accent text-white">
        <div className="container px-4 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-semibold tracking-tighter mb-4">Start building your forecasting reputation today.</h2>
          <p className="text-accent-foreground/80 mb-8 text-lg">Join hundreds of analysts publishing credible, time-stamped predictions.</p>
          <Button size="lg" variant="secondary" asChild className="h-12 px-10 text-base text-accent">
            <Link href="/signup">Create free account</Link>
          </Button>
          <p className="text-xs text-accent-foreground/60 mt-6">No credit card. No ads. No prediction markets.</p>
        </div>
      </section>

      <footer className="border-t py-10 text-sm text-muted-foreground">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} ForcastNetwork. A platform for evidence-based forecasting.</div>
          <div className="flex gap-5">
            <Link href="/forecasts">Explore</Link>
            <Link href="/leaderboard">Leaderboard</Link>
            <Link href="/signup">Join</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
