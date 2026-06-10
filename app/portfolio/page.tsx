"use client"

import Link from "next/link"
import { usePredictionStore } from "@/lib/prediction-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatPrice } from "@/types"
import { ArrowUpRight, ArrowDownRight, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function PortfolioPage() {
  const {
    balance,
    positions,
    trades,
    markets,
    sellShares,
    getMarket,
    getTotalPnL,
    resetDemo,
  } = usePredictionStore()

  const totalPnL = getTotalPnL()
  const portfolioValue = balance + positions.reduce((sum, pos) => {
    const m = getMarket(pos.marketId)
    if (!m) return sum
    const price = pos.side === "yes" ? m.yesPrice : m.noPrice
    return sum + pos.shares * price
  }, 0)

  const handleSell = (marketId: string, side: "yes" | "no", shares: number) => {
    const success = sellShares(marketId, side, shares)
    if (success) {
      toast.success(`Sold ${shares} ${side.toUpperCase()} shares`)
    } else {
      toast.error("Could not sell position")
    }
  }

  const handleAddDemoFunds = () => {
    // Direct mutation is ugly — better to expose a method but for speed we use a quick hack via reset + adjust
    // Actually just bump balance in a clean way
    usePredictionStore.setState((s) => ({ balance: Math.round((s.balance + 5000) * 100) / 100 }))
    toast.success("Added 5,000 USDC (demo funds)")
  }

  const openPositions = positions
    .map((pos) => {
      const market = markets.find((m) => m.id === pos.marketId)
      if (!market) return null
      const currentPrice = pos.side === "yes" ? market.yesPrice : market.noPrice
      const currentValue = pos.shares * currentPrice
      const cost = pos.shares * pos.avgPrice
      const pnl = currentValue - cost
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0

      return {
        ...pos,
        market,
        currentPrice,
        currentValue,
        pnl,
        pnlPercent,
      }
    })
    .filter(Boolean) as any[]

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-semibold tracking-tighter">Portfolio</h1>
          <p className="text-muted-foreground">Your positions and trading activity on ForcastNetwork</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAddDemoFunds} className="gap-2">
            <Plus className="h-4 w-4" /> Add 5,000 USDC
          </Button>
          <Button variant="ghost" onClick={resetDemo} className="gap-2 text-destructive">
            <Trash2 className="h-4 w-4" /> Reset All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available USDC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold tabular-nums tracking-tighter text-emerald-400">
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold tabular-nums tracking-tighter">
              {formatCurrency(portfolioValue)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Cash + open positions at current prices</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unrealized PnL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-semibold tabular-nums tracking-tighter flex items-center gap-2 ${totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {totalPnL >= 0 ? <ArrowUpRight className="h-7 w-7" /> : <ArrowDownRight className="h-7 w-7" />}
              {formatCurrency(totalPnL)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Based on current market prices</div>
          </CardContent>
        </Card>
      </div>

      {/* Open Positions */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Open Positions ({openPositions.length})</h2>
          <Link href="/markets" className="text-sm text-accent hover:underline">Browse more markets →</Link>
        </div>

        {openPositions.length > 0 ? (
          <div className="border rounded-xl overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Market</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Avg Entry</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Unrealized PnL</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openPositions.map((pos: any) => (
                  <TableRow key={`${pos.marketId}-${pos.side}`}>
                    <TableCell className="font-medium max-w-[260px] truncate">
                      <Link href={`/markets/${pos.marketId}`} className="hover:underline">
                        {pos.market.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pos.side === "yes" ? "default" : "destructive"} className="uppercase tracking-widest text-[10px]">
                        {pos.side}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{pos.shares.toFixed(0)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{formatPrice(pos.avgPrice)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPrice(pos.currentPrice)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatCurrency(pos.currentValue)}</TableCell>
                    <TableCell className={`text-right font-medium tabular-nums ${pos.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {pos.pnl >= 0 ? "+" : ""}{formatCurrency(pos.pnl)}
                      <span className="ml-1 text-xs">({pos.pnlPercent.toFixed(1)}%)</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSell(pos.marketId, pos.side, Math.min(100, Math.floor(pos.shares)))}
                      >
                        Sell 100
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border rounded-xl p-9 text-center bg-card text-muted-foreground">
            You have no open positions. Visit the <Link href="/markets" className="underline text-foreground">Markets</Link> page to start trading.
          </div>
        )}
      </div>

      {/* Trade History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Trade History ({trades.length})</h2>

        {trades.length > 0 ? (
          <div className="space-y-2">
            {trades.slice(0, 12).map((trade) => {
              const isBuy = trade.type === "buy"
              return (
                <div key={trade.id} className="flex items-center justify-between border rounded-lg px-4 py-3 bg-card text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={trade.side === "yes" ? "default" : "destructive"} className="uppercase tracking-widest text-[10px] shrink-0">
                      {trade.side}
                    </Badge>
                    <div className="truncate">
                      <Link href={`/markets/${trade.marketId}`} className="font-medium hover:underline">
                        {trade.marketTitle}
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right tabular-nums text-sm">
                    <div>
                      {isBuy ? "Bought" : "Sold"} <span className="font-medium">{trade.shares}</span> @ {formatPrice(trade.price)}
                    </div>
                    <div className={isBuy ? "text-rose-400" : "text-emerald-400"}>
                      {isBuy ? "-" : "+"}{formatCurrency(Math.abs(trade.cost))}
                    </div>
                    <div className="text-muted-foreground text-xs w-28">
                      {new Date(trade.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="border rounded-xl p-9 text-center bg-card text-muted-foreground text-sm">
            No trades yet. Buy your first shares on the markets page.
          </div>
        )}
      </div>
    </div>
  )
}
