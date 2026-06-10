"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { usePredictionStore } from "@/lib/prediction-store"
import { MARKET_CATEGORIES } from "@/lib/mock-markets"
import type { MarketCategory } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MarketCard } from "@/components/market-card"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function CreateMarketPage() {
  const { address, isConnected } = useAccount()
  const { createMarket } = usePredictionStore()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<MarketCategory>("Winner")
  const [yesPrice, setYesPrice] = useState(0.5)
  const [endDate, setEndDate] = useState("2026-07-19")

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in title and description")
      return
    }

    if (yesPrice < 0.01 || yesPrice > 0.99) {
      toast.error("Yes price must be between 1% and 99%")
      return
    }

    setIsSubmitting(true)

    try {
      const isoEndDate = new Date(endDate).toISOString()

      const newMarketId = createMarket({
        title,
        description,
        category,
        yesPrice,
        endDate: isoEndDate,
      })

      toast.success("Market created successfully!", {
        description: "It is now live and tradable by all users.",
      })

      // Reset form
      setTitle("")
      setDescription("")
      setYesPrice(0.5)
      setEndDate("2026-07-19")

      // Optional: redirect to the new market
      window.location.href = `/markets/${newMarketId}`
    } catch (error) {
      toast.error("Failed to create market")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" /> Back to Admin
          </Link>
        </Button>
        <div className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Admin • Create Market</div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-2xl">Create New Market</CardTitle>
              <CardDescription>
                Add a custom FIFA World Cup 2026 prediction market. It will be immediately tradable.
              </CardDescription>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
            {isConnected ? (
              <>Connected as: <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span></>
            ) : (
              <span className="text-amber-500">Demo Mode — Connect wallet for production-like protection</span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">ADMIN</span>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Market Title</Label>
              <Input
                id="title"
                placeholder="e.g. Spain to win the 2026 World Cup"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the market outcome..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={category}
                  onValueChange={(val) => setCategory(val as MarketCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKET_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yesPrice">Initial Yes Price</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="yesPrice"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.99"
                    value={yesPrice}
                    onChange={(e) => setYesPrice(parseFloat(e.target.value))}
                    className="font-mono text-lg"
                  />
                  <div className="text-sm text-muted-foreground w-12">
                    {(yesPrice * 100).toFixed(0)}¢
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  No price will be set automatically to maintain ~1% spread.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Resolution Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min="2026-06-01"
                max="2026-08-01"
                required
              />
              <p className="text-xs text-muted-foreground">
                When this event is expected to be resolved.
              </p>
            </div>

            {/* Live Preview */}
            <div className="pt-2 border-t">
              <Label className="text-xs text-muted-foreground mb-2 block">LIVE PREVIEW (how it will appear to traders)</Label>
              <div className="scale-[0.92] origin-top-left pointer-events-none">
                <MarketCard
                  market={{
                    id: "preview",
                    title: title || "Your new market title will appear here",
                    description: description || "Description preview...",
                    category: category,
                    yesPrice: yesPrice,
                    noPrice: Math.max(0.01, 1 - yesPrice - 0.01),
                    volume: 0,
                    endDate: new Date(endDate).toISOString(),
                    resolved: false,
                  }}
                  showTradeButtons={false}
                />
              </div>
            </div>

            <div className="pt-4 border-t flex gap-3">
              <Button type="submit" size="lg" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Creating Market..." : "Create Market & Go Live"}
              </Button>
              <Button type="button" variant="outline" size="lg" asChild>
                <Link href="/markets">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        New markets are added to the live trading pool immediately. This is a demo — data resets on full page refresh unless persisted via API.
      </p>
    </div>
  )
}
