"use client"

import { useState } from "react"
import Link from "next/link"
import { usePredictionStore } from "@/lib/prediction-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatPrice } from "@/types"
import { Plus, RefreshCw, Eye, CheckCircle, Trash2, ArrowRight } from "lucide-react"
import { toast } from "sonner"

export default function AdminDashboard() {
  const { markets, balance, resetDemo, resolveMarket, deleteMarket } = usePredictionStore()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("all")

  const filteredMarkets = markets
    .filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !m.resolved) ||
        (statusFilter === "resolved" && m.resolved)
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (a.resolved === b.resolved) return b.volume - a.volume
      return a.resolved ? 1 : -1
    })

  const stats = {
    total: markets.length,
    active: markets.filter((m) => !m.resolved).length,
    resolved: markets.filter((m) => m.resolved).length,
    totalVolume: markets.reduce((sum, m) => sum + m.volume, 0),
    userCreated: markets.filter((m) => m.id.startsWith("custom-")).length,
  }

  const handleResolve = (marketId: string, outcome: "yes" | "no", title: string) => {
    resolveMarket(marketId, outcome)
    toast.success(`Market resolved: ${outcome.toUpperCase()}`, {
      description: title,
    })
  }

  const handleDelete = (marketId: string, title: string) => {
    deleteMarket(marketId)
    toast.error("Market deleted", { description: title })
  }

  const handleReset = () => {
    resetDemo()
    toast.success("Demo data reset", { description: "All markets, positions, and balance restored." })
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {/* Professional Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Admin Panel</h1>
              <p className="text-muted-foreground">ForcastNetwork • FIFA World Cup 2026</p>
            </div>
            <Badge variant="outline" className="ml-2 text-xs">DEMO</Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Reset All Demo Data
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link href="/admin/create-market">
              <Plus className="h-4 w-4" /> Create Market
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/markets" className="gap-1">
              View Public Site <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview - Professional Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums tracking-tighter">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums tracking-tighter text-emerald-400">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums tracking-tighter text-muted-foreground">{stats.resolved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums tracking-tighter">{formatCurrency(stats.totalVolume)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">User-Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums tracking-tighter text-amber-400">{stats.userCreated}</div>
            <p className="text-xs text-muted-foreground mt-1">Created via this admin panel</p>
          </CardContent>
        </Card>
      </div>

      {/* Market Management Table */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-xl">Market Management</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Resolve outcomes, delete test markets, or monitor trading activity.</p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64"
            />
            <div className="flex gap-1">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "resolved" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("resolved")}
              >
                Resolved
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Market</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Yes Price</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMarkets.length > 0 ? (
                  filteredMarkets.map((market) => (
                    <TableRow key={market.id}>
                      <TableCell className="font-medium max-w-[320px]">
                        <Link href={`/markets/${market.id}`} className="hover:underline line-clamp-2">
                          {market.title}
                        </Link>
                        <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {market.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{market.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatPrice(market.yesPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatCurrency(market.volume)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(market.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {market.resolved ? (
                          <Badge variant="secondary" className="text-xs">
                            Resolved: {market.resolvedOutcome?.toUpperCase()}
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                            <Link href={`/markets/${market.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>

                          {!market.resolved && (
                            <>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Resolve
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Resolve Market</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Choose the winning outcome for: <strong>{market.title}</strong>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="gap-2">
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleResolve(market.id, "yes", market.title)}
                                      className="bg-emerald-600 hover:bg-emerald-700"
                                    >
                                      Yes Wins
                                    </AlertDialogAction>
                                    <AlertDialogAction
                                      onClick={() => handleResolve(market.id, "no", market.title)}
                                      className="bg-rose-600 hover:bg-rose-700"
                                    >
                                      No Wins
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDelete(market.id, market.title)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No markets match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-xs text-muted-foreground flex items-center justify-between">
        <div>
          Demo admin • Changes are client-side only (Zustand + localStorage). 
          Connect a wallet for the full prediction market experience.
        </div>
        <Button variant="link" size="sm" asChild className="text-xs p-0">
          <Link href="/admin/create-market">+ Create another market</Link>
        </Button>
      </div>
    </div>
  )
}
