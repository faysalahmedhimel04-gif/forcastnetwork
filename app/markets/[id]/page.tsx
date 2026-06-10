"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { usePredictionStore } from "@/lib/prediction-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatPrice } from "@/types"
import { ArrowLeft, TrendingUp, Calendar } from "lucide-react"
import { toast } from "sonner"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

export default function MarketDetailPage() {
  const params = useParams<{ id: string }>()
  const marketId = params?.id as string

  const { markets, buyShares, sellShares, positions, trades, getPosition } = usePredictionStore()

  const market = markets.find((m) => m.id === marketId)
  const positionYes = getPosition(marketId, "yes")
  const positionNo = getPosition(marketId, "no")

  const [tradeSide, setTradeSide] = useState<"yes" | "no">("yes")
  const [tradeAmount, setTradeAmount] = useState(200) // default shares
  const [priceHistory, setPriceHistory] = useState<any[]>([])

  // Generate plausible price history ending at current price
  const currentPrice = market ? (tradeSide === "yes" ? market.yesPrice : market.noPrice) : 0.5

  useEffect(() => {
    if (!market) return

    // Create a nice 18-point history ending at the live price
    const points: any[] = []
    const base = market.yesPrice // use yes as base for chart
    let price = Math.max(0.12, Math.min(0.88, base - 0.09 + Math.random() * 0.04))

    for (let i = 0; i < 18; i++) {
      const variation = (Math.random() - 0.5) * 0.028
      price = Math.max(0.08, Math.min(0.92, price + variation))
      points.push({
        time: `${i * 4}h`,
        yes: Number(price.toFixed(3)),
        no: Number((1 - price - 0.008).toFixed(3)),
      })
    }

    // Force last point to current live prices
    points[points.length - 1] = {
      time: "now",
      yes: Number(market.yesPrice.toFixed(3)),
      no: Number(market.noPrice.toFixed(3)),
    }

    setPriceHistory(points)
  }, [market?.yesPrice, market?.noPrice, marketId]) // refresh when prices move

  if (!market) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">Market not found.</p>
        <Button asChild variant="outline">
          <Link href="/markets">Back to all markets</Link>
        </Button>
      </div>
    )
  }

  const cost = Math.round(tradeAmount * (tradeSide === "yes" ? market.yesPrice : market.noPrice) * 100) / 100

  const handleTrade = (type: "buy" | "sell") => {
    if (type === "buy") {
      const ok = buyShares(marketId, tradeSide, tradeAmount)
      if (ok) {
        toast.success(`Bought ${tradeAmount} ${tradeSide.toUpperCase()} @ ${formatPrice(tradeSide === "yes" ? market.yesPrice : market.noPrice)}`)
      } else {
        toast.error("Insufficient USDC balance")
      }
    } else {
      const pos = tradeSide === "yes" ? positionYes : positionNo
      const sharesToSell = Math.min(tradeAmount, pos?.shares || 0)
      if (sharesToSell <= 0) {
        toast.error("You don't have enough shares on this side")
        return
      }
      const ok = sellShares(marketId, tradeSide, sharesToSell)
      if (ok) toast.success(`Sold ${sharesToSell} ${tradeSide.toUpperCase()}`)
    }
  }

  const myYes = positionYes?.shares || 0
  const myNo = positionNo?.shares || 0

  const marketTrades = trades.filter((t) => t.marketId === marketId).slice(0, 8)

  const endDate = new Date(market.endDate)

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Back nav */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
          <Link href="/markets">
            <ArrowLeft className="h-4 w-4" /> All Markets
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Chart + Info */}
        <div className="lg:col-span-3 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge>{market.category}</Badge>
              <span className="text-xs text-muted-foreground tabular-nums">
                Ends {endDate.toLocaleDateString()} • {Math.ceil((endDate.getTime() - Date.now()) / 86400000)} days
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tighter leading-tight mb-3">{market.title}</h1>
            <p className="text-muted-foreground max-w-3xl">{market.description}</p>
          </div>

          {/* Price Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Price History (Yes / No)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis
                      domain={[0.05, 0.95]}
                      tickFormatter={(v) => (v * 100).toFixed(0) + "¢"}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value: any) => [((value || 0) * 100).toFixed(1) + "¢", ""]}
                      labelStyle={{ color: "#888" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="yes"
                      stroke="#4ade80"
                      strokeWidth={2.5}
                      dot={false}
                      name="Yes"
                    />
                    <Line
                      type="monotone"
                      dataKey="no"
                      stroke="#f87171"
                      strokeWidth={2.5}
                      dot={false}
                      name="No"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 text-center">
                Live prices update with every trade in this demo. Green = Yes • Red = No
              </div>
            </CardContent>
          </Card>

          {/* Your Position Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Position</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border p-4">
                <div className="text-emerald-400 font-medium mb-1">YES</div>
                <div className="text-2xl font-semibold tabular-nums">{myYes.toFixed(0)} shares</div>
                {positionYes && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Avg entry {formatPrice(positionYes.avgPrice)}
                  </div>
                )}
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-rose-400 font-medium mb-1">NO</div>
                <div className="text-2xl font-semibold tabular-nums">{myNo.toFixed(0)} shares</div>
                {positionNo && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Avg entry {formatPrice(positionNo.avgPrice)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Trading Panel */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Trade this market</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Side selector */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={tradeSide === "yes" ? "default" : "outline"}
                  className={tradeSide === "yes" ? "yes-btn" : ""}
                  onClick={() => setTradeSide("yes")}
                >
                  YES — {formatPrice(market.yesPrice)}
                </Button>
                <Button
                  variant={tradeSide === "no" ? "default" : "outline"}
                  className={tradeSide === "no" ? "no-btn" : ""}
                  onClick={() => setTradeSide("no")}
                >
                  NO — {formatPrice(market.noPrice)}
                </Button>
              </div>

              {/* Amount */}
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">SHARES TO TRADE</div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(Math.max(10, parseInt(e.target.value) || 10))}
                    className="text-xl font-semibold h-12"
                  />
                  <Button variant="outline" onClick={() => setTradeAmount(100)}>100</Button>
                  <Button variant="outline" onClick={() => setTradeAmount(500)}>500</Button>
                  <Button variant="outline" onClick={() => setTradeAmount(1000)}>1k</Button>
                </div>
              </div>

              {/* Cost preview */}
              <div className="rounded-lg bg-muted/40 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. cost / proceeds</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(cost)}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Fill price ≈ {formatPrice(tradeSide === "yes" ? market.yesPrice : market.noPrice)} (moves with impact)
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button
                  size="lg"
                  className="h-12 yes-btn text-base"
                  onClick={() => handleTrade("buy")}
                >
                  BUY {tradeSide.toUpperCase()}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 text-base"
                  onClick={() => handleTrade("sell")}
                >
                  SELL {tradeSide.toUpperCase()}
                </Button>
              </div>

              <div className="text-[11px] text-center text-muted-foreground">
                Buying pushes the price up. Selling pushes it down. All trades are instant in demo mode.
              </div>

              {/* Recent trades on this market */}
              {marketTrades.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Recent activity</div>
                  <div className="space-y-1 text-xs">
                    {marketTrades.map((t) => (
                      <div key={t.id} className="flex justify-between text-muted-foreground">
                        <span>{t.type.toUpperCase()} {t.shares} {t.side}</span>
                        <span className="font-mono">{formatPrice(t.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
