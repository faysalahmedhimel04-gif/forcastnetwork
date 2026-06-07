"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createForecast } from "@/lib/actions/forecasts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { FORECAST_CATEGORIES } from "@/types"
import type { PolymarketMarket } from "@/types"
import { Loader2, Link as LinkIcon, Search, X } from "lucide-react"

export default function CreateForecastClient({
  searchParams,
}: {
  searchParams?: Promise<{ link?: string }>
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [category, setCategory] = useState("")
  const [linkedMarket, setLinkedMarket] = useState<PolymarketMarket | null>(null)
  const [marketSearch, setMarketSearch] = useState("")
  const [marketResults, setMarketResults] = useState<PolymarketMarket[]>([])
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(false)
  const [isMarketDialogOpen, setIsMarketDialogOpen] = useState(false)

  const router = useRouter()
  const clientSearchParams = useSearchParams()

  // Support pre-linking via URL: /create?link=polymarket:some-slug
  useEffect(() => {
    async function handleLink() {
      // From promise (server) or client search params
      let link: string | null = null

      if (searchParams) {
        try {
          const sp = await searchParams
          link = sp.link || null
        } catch {}
      }
      if (!link) {
        link = clientSearchParams.get("link")
      }

      if (link && link.startsWith("polymarket:")) {
        const slug = link.replace("polymarket:", "")
        fetchMarketBySlug(slug)
      }
    }
    handleLink()
  }, [searchParams, clientSearchParams])

  async function fetchMarketBySlug(slug: string) {
    try {
      const res = await fetch(`/api/markets?limit=1&q=${encodeURIComponent(slug)}`)
      const data = await res.json()
      const found = data.markets?.find((m: PolymarketMarket) => m.slug === slug)
      if (found) {
        setLinkedMarket(found)
        if (!category) setCategory(found.category || "Other")
      }
    } catch (e) {
      // ignore
    }
  }

  async function searchPolymarketMarkets(query: string) {
    if (!query || query.length < 2) {
      setMarketResults([])
      return
    }
    setIsLoadingMarkets(true)
    try {
      const res = await fetch(`/api/markets?limit=25&q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setMarketResults(data.markets || [])
    } catch (e) {
      toast.error("Failed to load Polymarket markets")
      setMarketResults([])
    } finally {
      setIsLoadingMarkets(false)
    }
  }

  function selectMarket(market: PolymarketMarket) {
    setLinkedMarket(market)
    setIsMarketDialogOpen(false)
    setMarketResults([])
    setMarketSearch("")

    if (!category && market.category) {
      setCategory(market.category)
    }
    toast.success("Linked to Polymarket event")
  }

  function clearLinkedMarket() {
    setLinkedMarket(null)
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)

    if (linkedMarket) {
      formData.set("external_source", "polymarket")
      formData.set("external_id", linkedMarket.id)
      formData.set("external_slug", linkedMarket.slug)
      formData.set("external_market_price", String(linkedMarket.lastTradePrice ?? ""))
      formData.set("external_url", linkedMarket.url)
    }

    const result = await createForecast(formData)
    setIsSubmitting(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(linkedMarket 
        ? "Forecast published and linked to Polymarket event!" 
        : "Forecast published successfully!")
    }
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Create a new forecast</h1>
        <p className="text-muted-foreground mt-1">Be specific. Set a clear target date. Your reputation depends on it.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forecast details</CardTitle>
          <CardDescription>
            This will be public and permanently associated with your profile. 
            You can optionally link your forecast to a real-world event for added context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-6">
            {/* External link section (Polymarket reference) */}
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <LinkIcon className="h-4 w-4" /> Link to external event (optional)
                </div>
                {linkedMarket && (
                  <Button type="button" variant="ghost" size="sm" onClick={clearLinkedMarket}>
                    <X className="h-3.5 w-3.5 mr-1" /> Remove link
                  </Button>
                )}
              </div>

              {linkedMarket ? (
                <div className="flex items-start justify-between gap-3 rounded-md border bg-background p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">Polymarket</Badge>
                      <span className="font-medium text-sm truncate">{linkedMarket.question}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                      <span>Current price: <span className="font-mono tabular-nums">{(linkedMarket.lastTradePrice ?? 0).toFixed(2)}</span></span>
                      <a href={linkedMarket.url} target="_blank" rel="noreferrer" className="underline hover:no-underline">View on Polymarket →</a>
                    </div>
                  </div>
                </div>
              ) : (
                <Dialog open={isMarketDialogOpen} onOpenChange={setIsMarketDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-start">
                      <Search className="h-4 w-4 mr-2" /> Browse active Polymarket events
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Browse Polymarket Events (reference only)</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search markets (e.g. election, fed, bitcoin...)"
                          value={marketSearch}
                          onChange={(e) => {
                            setMarketSearch(e.target.value)
                            searchPolymarketMarkets(e.target.value)
                          }}
                        />
                      </div>

                      <div className="max-h-[420px] overflow-auto space-y-2 pr-1">
                        {isLoadingMarkets && <div className="text-sm text-muted-foreground p-4">Loading markets...</div>}
                        {!isLoadingMarkets && marketResults.length === 0 && marketSearch.length > 1 && (
                          <div className="text-sm text-muted-foreground p-4">No markets found for that search.</div>
                        )}
                        {marketResults.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => selectMarket(m)}
                            className="w-full text-left rounded-md border p-3 hover:bg-accent/10 transition flex flex-col gap-1"
                          >
                            <div className="font-medium text-sm leading-tight line-clamp-2">{m.question}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Price: {(m.lastTradePrice ?? 0).toFixed(2)}</span>
                              <span>•</span>
                              <span>{m.category}</span>
                              {m.volume && <span>• Vol ${(m.volume / 1_000_000).toFixed(1)}M</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Linking is for reference and transparency only. This platform does not support betting or trading.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <p className="text-[11px] text-muted-foreground mt-2">
                Linking adds context and a price snapshot from the time of creation. Your forecast accuracy is still based on your own prediction.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title / Claim *</Label>
              <Input 
                id="title" name="title" required minLength={10} maxLength={200} 
                defaultValue={linkedMarket ? linkedMarket.question : ""}
                placeholder="Will the Fed cut rates by December 2026?" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed reasoning &amp; context *</Label>
              <Textarea 
                id="description" name="description" required minLength={20} 
                className="min-h-[120px]" 
                defaultValue={linkedMarket ? `Linked to Polymarket: ${linkedMarket.url}\n\n` : ""}
                placeholder="Explain your thinking, key indicators, and sources..." 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select name="category" required value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORECAST_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_date">Resolution / Target date *</Label>
                <Input 
                  id="target_date" name="target_date" type="date" required 
                  min={new Date(Date.now() + 86400000).toISOString().split("T")[0]} 
                />
                <p className="text-[11px] text-muted-foreground">Must be a future date when the outcome will be known.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="predicted_outcome">Your predicted outcome *</Label>
                <Input 
                  id="predicted_outcome" name="predicted_outcome" required maxLength={120}
                  placeholder="Yes  •  No  •  Candidate X wins  •  > 2.8%" 
                />
                <p className="text-[11px] text-muted-foreground">Be as precise as possible — this is what gets compared at resolution.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initial_confidence">Confidence level (1–100) *</Label>
                <Input 
                  id="initial_confidence" name="initial_confidence" type="number" min="1" max="100" defaultValue="65" required 
                />
              </div>
            </div>

            {/* Hidden fields for external link */}
            {linkedMarket && (
              <>
                <input type="hidden" name="external_source" value="polymarket" />
                <input type="hidden" name="external_id" value={linkedMarket.id} />
                <input type="hidden" name="external_slug" value={linkedMarket.slug} />
                <input type="hidden" name="external_market_price" value={String(linkedMarket.lastTradePrice ?? "")} />
                <input type="hidden" name="external_url" value={linkedMarket.url} />
              </>
            )}

            <div className="pt-4 flex gap-3">
              <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-[160px]">
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : "Publish forecast"}
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground mt-6">
        Your forecast will be visible immediately. You can resolve it yourself once the outcome is known.
      </p>
    </div>
  )
}
