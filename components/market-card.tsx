"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePredictionStore } from "@/lib/prediction-store"
import type { Market } from "@/types"
import { formatPrice, formatCurrency } from "@/types"
import { TrendingUp, Calendar } from "lucide-react"
import { toast } from "sonner"

interface MarketCardProps {
  market: Market
  showTradeButtons?: boolean
}

export function MarketCard({ market, showTradeButtons = true }: MarketCardProps) {
  const { buyShares } = usePredictionStore()

  const yesPrice = market.yesPrice
  const noPrice = market.noPrice
  const priceChange = ((yesPrice - 0.5) * 100).toFixed(1) // simple visual from 50¢

  const handleQuickBuy = (side: 'yes' | 'no', shares: number) => {
    const success = buyShares(market.id, side, shares)
    if (success) {
      toast.success(`Bought ${shares} ${side.toUpperCase()} shares @ ${formatPrice(side === 'yes' ? yesPrice : noPrice)}`)
    } else {
      toast.error("Not enough USDC balance or market unavailable")
    }
  }

  const endDate = new Date(market.endDate)
  const daysLeft = Math.max(
    0,
    Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )

  return (
    <Card className="market-card group overflow-hidden pitch-accent">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <Badge variant="outline" className="mb-2 text-[10px] tracking-widest">
              {market.category}
            </Badge>
            <Link
              href={`/markets/${market.id}`}
              className="block font-semibold text-[15px] leading-tight line-clamp-3 group-hover:text-accent transition-colors"
            >
              {market.title}
            </Link>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground">Yes</div>
            <div className="text-2xl font-semibold tabular-nums tracking-tighter text-emerald-400">
              {formatPrice(yesPrice)}
            </div>
          </div>
        </div>

        {/* No price + volume */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div>
            <span className="text-muted-foreground">No</span>{" "}
            <span className="font-semibold tabular-nums text-rose-400">{formatPrice(noPrice)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            {formatCurrency(market.volume)} vol
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {daysLeft} days left
            </span>
          </div>
          <span className="font-mono text-[10px]">{endDate.toLocaleDateString()}</span>
        </div>

        {/* Quick trade buttons (Polymarket style) */}
        {showTradeButtons && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              className="yes-btn h-9 text-sm"
              onClick={() => handleQuickBuy('yes', 100)}
            >
              Buy Yes • 100
            </Button>
            <Button
              size="sm"
              className="no-btn h-9 text-sm"
              onClick={() => handleQuickBuy('no', 100)}
            >
              Buy No • 100
            </Button>
          </div>
        )}

        {/* View details */}
        <Link
          href={`/markets/${market.id}`}
          className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View market details &amp; trade →
        </Link>
      </CardContent>
    </Card>
  )
}
