import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resolveForecast } from "@/lib/actions/forecasts"
import { CommentSection } from "@/components/comment-section"
import { formatDate, formatDateTime } from "@/lib/utils"
import { PolymarketPrice } from "@/components/polymarket-price"
import type { Comment } from "@/types"

// Force dynamic rendering. This page performs auth + data lookups and supports
// mutations (resolve, comments). Avoids prerender failures when env vars are absent at build.
export const dynamic = 'force-dynamic'

export default async function ForecastDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Prefer backend API for forecast data (centralized, consistent with other pages)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001')
  let forecast: any = null
  let comments: Comment[] = []

  try {
    const forecastRes = await fetch(`${backendUrl}/api/forecasts/${id}`, {
      next: { revalidate: 30 },
    })
    if (forecastRes.ok) {
      const { data: forecastData } = await forecastRes.json()
      forecast = forecastData
    }

    const commentsRes = await fetch(`${backendUrl}/api/comments?forecast_id=${id}`, {
      next: { revalidate: 30 },
    })
    if (commentsRes.ok) {
      const { data: commentsData = [] } = await commentsRes.json()
      comments = commentsData
    }
  } catch (e) {
    // fallback will be handled below
  }

  // Fallback to direct Supabase only if backend call failed (e.g. during some build scenarios)
  if (!forecast) {
    const { data: forecastRaw } = await supabase
      .from("forecasts")
      .select(`*, profiles:user_id (id, username, full_name, avatar_url, accuracy, total_forecasts)`)
      .eq("id", id)
      .single()
    forecast = forecastRaw
  }

  if (!forecast) notFound()

  const analyst = forecast.profiles

  if (comments.length === 0) {
    const { data: commentsRaw } = await supabase
      .from("comments")
      .select(`*, profiles:user_id (username, full_name, avatar_url)`)
      .eq("forecast_id", id)
      .order("created_at", { ascending: false })

    comments = (commentsRaw || []).map((c: any) => ({
      ...c,
      username: c.profiles?.username,
      full_name: c.profiles?.full_name,
      avatar_url: c.profiles?.avatar_url,
    }))
  }

  const isOwner = user?.id === forecast.user_id
  const isResolved = forecast.status === "resolved"

  return (
    <div className="container max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/forecasts" className="text-sm text-muted-foreground hover:text-foreground">← Back to all forecasts</Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <Badge variant="secondary" className="mb-3">{forecast.category}</Badge>
          <h1 className="text-3xl font-semibold tracking-tight leading-tight pr-4">{forecast.title}</h1>
        </div>
        <div>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${isResolved 
            ? forecast.is_correct ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" 
            : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" 
            : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"}`}>
            {isResolved ? (forecast.is_correct ? "✓ Resolved Correct" : "✕ Resolved Incorrect") : "Open"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Link href={`/analysts/${analyst?.username}`} className="flex items-center gap-2.5 group">
          <Avatar>
            <AvatarImage src={analyst?.avatar_url || undefined} />
            <AvatarFallback>{(analyst?.full_name || analyst?.username || "A").slice(0,2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium group-hover:underline">{analyst?.full_name || analyst?.username}</div>
            <div className="text-xs text-muted-foreground">@{analyst?.username} · {analyst?.accuracy?.toFixed(0)}% accuracy</div>
          </div>
        </Link>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none mb-8">
        <p className="text-lg text-foreground/90 leading-relaxed">{forecast.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Card>
          <CardContent className="pt-5 text-sm">
            <div className="text-muted-foreground">Predicted outcome</div>
            <div className="font-semibold text-xl mt-1">{forecast.predicted_outcome}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-sm">
            <div className="text-muted-foreground">Confidence at creation</div>
            <div className="font-semibold text-xl mt-1 tabular-nums">{forecast.initial_confidence}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-sm">
            <div className="text-muted-foreground">Target resolution date</div>
            <div className="font-semibold text-xl mt-1">{formatDate(forecast.target_date)}</div>
            {!isResolved && <div className="text-xs text-emerald-600 mt-0.5">Resolves in the future</div>}
          </CardContent>
        </Card>
      </div>

      {/* Polymarket reference (if linked) */}
      {forecast.external_source === "polymarket" && forecast.external_slug && forecast.external_url && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="uppercase text-xs tracking-[1px] font-medium text-amber-600 dark:text-amber-400">Reference Market</span>
            <span className="text-xs text-muted-foreground">(for context — not trading)</span>
          </div>
          <PolymarketPrice 
            slug={forecast.external_slug} 
            initialPrice={forecast.external_market_price} 
            url={forecast.external_url} 
          />

          {/* Simple comparison stat */}
          {forecast.external_market_price != null && (
            <div className="mt-3 text-xs bg-muted/50 border rounded-lg p-3">
              <div className="font-medium mb-1">Your call vs Market at creation</div>
              <div>
                You predicted <span className="font-semibold">{forecast.predicted_outcome}</span> with <span className="font-semibold tabular-nums">{forecast.initial_confidence}%</span> confidence.
              </div>
              <div className="text-muted-foreground">
                Market price then: <span className="font-mono tabular-nums">{Number(forecast.external_market_price).toFixed(3)}</span>
                {" · "}
                {forecast.predicted_outcome.toLowerCase().includes("yes") || forecast.predicted_outcome.toLowerCase() === "yes" ? (
                  <>Implied edge: <span className="font-medium">{(forecast.initial_confidence / 100 - Number(forecast.external_market_price)).toFixed(3)}</span></>
                ) : forecast.predicted_outcome.toLowerCase().includes("no") || forecast.predicted_outcome.toLowerCase() === "no" ? (
                  <>Implied edge (for No): <span className="font-medium">{((1 - forecast.initial_confidence / 100) - (1 - Number(forecast.external_market_price))).toFixed(3)}</span></>
                ) : (
                  <>Market snapshot available for reference.</>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">Positive = you were more confident than the market price at the time you published.</div>
            </div>
          )}
        </div>
      )}

      {/* Resolution section */}
      {isResolved && (
        <div className="mb-10 p-5 rounded-xl bg-muted/50 border">
          <div className="uppercase text-xs tracking-widest font-medium text-muted-foreground mb-1">RESOLVED OUTCOME</div>
          <div className="text-2xl font-semibold">{forecast.resolved_outcome}</div>
          <div className="text-sm mt-1 text-muted-foreground">
            Resolved {forecast.resolved_at ? formatDateTime(forecast.resolved_at) : ""}
          </div>
        </div>
      )}

      {/* Resolve dialog - only owner + open */}
      {isOwner && !isResolved && (
        <div className="mb-10">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg" variant="default">Resolve this forecast</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mark forecast as resolved</DialogTitle>
                <DialogDescription>
                  Enter the actual outcome. We will compare it to your original prediction to calculate accuracy.
                </DialogDescription>
              </DialogHeader>

              <form action={resolveForecast} className="space-y-4 mt-2">
                <input type="hidden" name="forecast_id" value={forecast.id} />
                
                <div>
                  <Label htmlFor="resolved_outcome">Actual outcome</Label>
                  <Input 
                    id="resolved_outcome" 
                    name="resolved_outcome" 
                    placeholder="e.g. Yes  or  No  or  Specific result" 
                    required 
                    className="mt-1.5" 
                  />
                  <p className="text-xs mt-1.5 text-muted-foreground">Your original prediction was: <strong>{forecast.predicted_outcome}</strong></p>
                </div>

                <Button type="submit" className="w-full">Confirm resolution</Button>
              </form>
            </DialogContent>
          </Dialog>
          <p className="text-xs text-muted-foreground mt-2">You can only resolve your own forecasts. Once resolved, accuracy is locked in.</p>
        </div>
      )}

      {/* Comments */}
      <div className="mt-4">
        <CommentSection 
          forecastId={forecast.id} 
          initialComments={comments} 
          isAuthenticated={!!user} 
        />
      </div>

      <div className="text-center mt-14 text-xs text-muted-foreground">
        Created {formatDateTime(forecast.created_at)}
      </div>
    </div>
  )
}
