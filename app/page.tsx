"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MarketCard } from "@/components/market-card"
import { usePredictionStore } from "@/lib/prediction-store"
import { getMockMarkets } from "@/lib/mock-markets"
import type { Market } from "@/types"
import { ArrowRight, Trophy, TrendingUp, Users, Zap } from "lucide-react"

export default function LandingPage() {
  const { markets: liveMarkets } = usePredictionStore()
  const [featured, setFeatured] = useState<Market[]>([])

  useEffect(() => {
    // Prefer live prices from the store, fall back to static mocks
    const base = liveMarkets.length > 0 ? liveMarkets : getMockMarkets()
    // Pick high-volume interesting markets for the homepage
    const sorted = [...base].sort((a, b) => b.volume - a.volume)
    setFeatured(sorted.slice(0, 6))
  }, [liveMarkets])

  return (
    <div className="flex flex-col">
      {/* Hero — Prediction Market */}
      <section className="relative border-b bg-gradient-to-b from-background to-muted/30 pt-16 pb-20">
        <div className="container px-4 mx-auto max-w-5xl text-center">
          <Badge className="mb-4 bg-accent/10 text-accent border-accent/20" variant="outline">
            FIFA World Cup 2026 • Live Trading
          </Badge>

          <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter mb-6">
            Trade the World Cup.<br />Yes or No.
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-8">
            The premier prediction market for FIFA World Cup 2026. Buy and sell shares on every match, 
            the champion, Golden Boot, and more. Powered by crypto wallets. Fake USDC to start.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild className="h-12 px-9 text-base">
              <Link href="/markets">Start Trading Markets</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-9 text-base">
              <Link href="/portfolio">View Portfolio</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Connect your wallet in the top right • 10,000 USDC demo balance included
          </p>
        </div>
      </section>

      {/* Quick stats */}
      <section className="border-b py-5 bg-muted/40">
        <div className="container max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-y-6 text-center text-sm">
          <div>
            <div className="font-semibold text-2xl tabular-nums tracking-tight">12</div>
            <div className="text-muted-foreground">Active markets</div>
          </div>
          <div>
            <div className="font-semibold text-2xl tabular-nums tracking-tight">$4.2M</div>
            <div className="text-muted-foreground">Total volume traded</div>
          </div>
          <div>
            <div className="font-semibold text-2xl tabular-nums tracking-tight">3,841</div>
            <div className="text-muted-foreground">Trades executed</div>
          </div>
          <div>
            <div className="font-semibold text-2xl tabular-nums tracking-tight">2,109</div>
            <div className="text-muted-foreground">Wallets connected</div>
          </div>
        </div>
      </section>

      {/* Featured Markets */}
      <section className="py-14 border-b">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="uppercase tracking-[2px] text-xs text-accent font-medium mb-1">LIVE NOW</div>
              <h2 className="text-3xl font-semibold tracking-tight">Featured World Cup Markets</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/markets" className="gap-1">See all markets <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>

          {featured.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((m) => (
                <MarketCard key={m.id} market={m} />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground">Loading markets…</div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-muted/30 border-b">
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold tracking-tight mb-2">How ForcastNetwork works</h2>
            <p className="text-muted-foreground">Polymarket-style share trading, built for the beautiful game.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 bg-background">
              <CardContent className="pt-6">
                <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                  <Trophy className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">1. Connect Wallet</h3>
                <p className="text-muted-foreground text-[15px]">
                  Use MetaMask or WalletConnect. Your wallet address is your identity. No email required for trading.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-background">
              <CardContent className="pt-6">
                <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">2. Buy Yes or No Shares</h3>
                <p className="text-muted-foreground text-[15px]">
                  Every market has a Yes and a No price (adds up to ~99¢). Prices move with real buying and selling pressure.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-background">
              <CardContent className="pt-6">
                <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                  <Zap className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold text-lg mb-2">3. Trade &amp; Profit</h3>
                <p className="text-muted-foreground text-[15px]">
                  Sell anytime before resolution. When the event ends, winning shares pay out $1 each. Track everything in your Portfolio.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link href="/markets">Browse all 2026 World Cup markets</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 border-t">
        <div className="container max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tighter mb-3">Ready to trade the beautiful game?</h2>
          <p className="text-muted-foreground mb-6">Connect your wallet and start with 10,000 fake USDC. Real on-chain markets on Base &amp; Polygon coming soon.</p>
          <Button size="lg" asChild className="px-10">
            <Link href="/markets">Open Markets</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8 text-sm text-muted-foreground">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} ForcastNetwork — FIFA World Cup 2026 Prediction Markets (demo)</div>
          <div className="flex gap-5">
            <Link href="/markets">Markets</Link>
            <Link href="/portfolio">Portfolio</Link>
            <Link href="/leaderboard">Leaderboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
