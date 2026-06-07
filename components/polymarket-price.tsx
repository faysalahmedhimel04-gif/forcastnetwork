"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { PolymarketMarket } from "@/types"

interface PolymarketPriceProps {
  slug: string
  initialPrice?: number | null
  url: string
}

export function PolymarketPrice({ slug, initialPrice, url }: PolymarketPriceProps) {
  const [market, setMarket] = useState<PolymarketMarket | null>(null)
  const [loading, setLoading] = useState(false)

  async function loadPrice() {
    setLoading(true)
    try {
      const res = await fetch(`/api/markets?limit=1&q=${encodeURIComponent(slug)}`)
      const data = await res.json()
      const found = data.markets?.[0]
      if (found) setMarket(found)
    } catch (e) {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // initial load + poll every 45 seconds for "live" feel
    loadPrice()
    const interval = setInterval(loadPrice, 45000)
    return () => clearInterval(interval)
  }, [slug])

  const currentPrice = market?.lastTradePrice ?? initialPrice
  const hasData = currentPrice != null

  return (
    <div className="rounded-xl border p-4 bg-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Polymarket reference (live)</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
            {hasData ? (currentPrice as number).toFixed(3) : "—"}
          </div>
          <div className="text-[11px] text-muted-foreground -mt-0.5">Implied probability (primary outcome)</div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={loadPrice} 
            disabled={loading}
            className="h-7 px-2 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[11px] underline text-muted-foreground hover:text-foreground"
          >
            View on Polymarket ↗
          </a>
        </div>
      </div>

      {initialPrice != null && market?.lastTradePrice != null && (
        <div className="mt-3 text-[11px] text-muted-foreground border-t pt-2">
          At creation: <span className="font-mono">{initialPrice.toFixed(3)}</span> → now <span className="font-mono">{market.lastTradePrice.toFixed(3)}</span>
        </div>
      )}
    </div>
  )
}
