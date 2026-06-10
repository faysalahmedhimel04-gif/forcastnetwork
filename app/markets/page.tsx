"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { usePredictionStore } from "@/lib/prediction-store"
import { MarketCard } from "@/components/market-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MARKET_CATEGORIES } from "@/lib/mock-markets"
import type { MarketCategory } from "@/types"
import { formatCurrency } from "@/types"
import { RefreshCw, Search, Trophy, Plus } from "lucide-react"
import { toast } from "sonner"

export default function MarketsPage() {
  const { markets, balance, resetDemo } = usePredictionStore()
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<MarketCategory | "All">("All")

  const filteredMarkets = useMemo(() => {
    return markets
      .filter((m) => !m.resolved)
      .filter((m) => {
        const matchesSearch =
          search === "" ||
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          m.description.toLowerCase().includes(search.toLowerCase())
        const matchesCategory =
          activeCategory === "All" || m.category === activeCategory
        return matchesSearch && matchesCategory
      })
      .sort((a, b) => b.volume - a.volume) // highest volume first
  }, [markets, search, activeCategory])

  const totalVolume = markets.reduce((sum, m) => sum + m.volume, 0)

  const handleReset = () => {
    resetDemo()
    setSearch("")
    setActiveCategory("All")
    toast.success("Demo data reset. Fresh 10,000 USDC balance.")
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-accent" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tighter">World Cup 2026 Markets</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Trade Yes/No shares on the biggest event in football. Prices move with every trade. All in fake USDC — real on-chain markets coming to Base &amp; Polygon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-sm hidden sm:block">
            <div className="text-muted-foreground">Total volume</div>
            <div className="font-semibold tabular-nums">{formatCurrency(totalVolume)}</div>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Reset Demo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search markets (Argentina, Mbappé, England...)"
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant={activeCategory === "All" ? "default" : "outline"}
            className="cursor-pointer px-4 h-9 text-sm"
            onClick={() => setActiveCategory("All")}
          >
            All
          </Badge>
          {MARKET_CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              className="cursor-pointer px-4 h-9 text-sm"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Quick admin create link */}
      <div className="mb-6 -mt-2 text-right">
        <Button asChild size="sm" variant="outline" className="gap-1.5">
          <Link href="/admin/create-market">
            <Plus className="h-4 w-4" /> Create New Market (Admin)
          </Link>
        </Button>
      </div>

      {/* Balance hint */}
      <div className="mb-6 text-sm text-muted-foreground flex items-center gap-2">
        Your balance: <span className="font-medium text-emerald-400 tabular-nums">{formatCurrency(balance)}</span>
        <span className="mx-1">•</span>
        Click <span className="font-medium">Buy Yes / Buy No</span> for instant 100-share trades. Go to a market for bigger size.
      </div>

      {/* Markets Grid */}
      {filteredMarkets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      ) : (
        <div className="border rounded-xl p-12 text-center text-muted-foreground bg-card">
          No markets match your search/filter.
          <Button variant="link" onClick={() => { setSearch(""); setActiveCategory("All") }}>
            Clear filters
          </Button>
        </div>
      )}

      <div className="mt-10 text-xs text-muted-foreground text-center">
        Prices are driven by real trading activity in this demo. Higher demand = higher price. This is not financial advice.
      </div>
    </div>
  )
}
