"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MessageCircle, TrendingUp } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { ForecastWithAnalyst } from "@/types"

interface ForecastCardProps {
  forecast: ForecastWithAnalyst
  showAnalyst?: boolean
  onFollow?: (userId: string) => void
  isFollowing?: boolean
}

export function ForecastCard({ forecast, showAnalyst = true, onFollow, isFollowing }: ForecastCardProps) {
  const isResolved = forecast.status === "resolved"
  const isCorrect = forecast.is_correct

  const statusLabel = isResolved 
    ? (isCorrect ? "Correct" : "Incorrect") 
    : "Open"

  const statusClass = isResolved 
    ? (isCorrect ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400")
    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"

  const confidenceColor = 
    forecast.initial_confidence >= 80 ? "text-emerald-600 dark:text-emerald-400" :
    forecast.initial_confidence >= 60 ? "text-amber-600 dark:text-amber-400" : "text-orange-600 dark:text-orange-400"

  const daysUntil = !isResolved 
    ? Math.ceil((new Date(forecast.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) 
    : null

  return (
    <Card className="forecast-card group h-full flex flex-col border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="secondary" className="category-badge">
                {forecast.category}
              </Badge>
              {forecast.external_source === "polymarket" && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-px border-amber-500/40 text-amber-600 dark:text-amber-400">
                  Polymarket
                </Badge>
              )}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass}`}>
                {statusLabel}
              </span>
            </div>
            <Link href={`/forecasts/${forecast.id}`} className="block">
              <h3 className="font-semibold text-[15px] leading-tight tracking-[-0.2px] line-clamp-2 group-hover:text-accent transition-colors">
                {forecast.title}
              </h3>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {forecast.description}
        </p>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Prediction:</span>
            <span className="font-medium text-foreground">{forecast.predicted_outcome}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className={`font-semibold tabular-nums ${confidenceColor}`}>
              {forecast.initial_confidence}%
            </span>
          </div>
        </div>

        {forecast.external_source === "polymarket" && forecast.external_market_price != null && (
          <div className="mt-2 text-[11px] text-muted-foreground">
            Linked market price at creation: <span className="font-mono tabular-nums text-foreground">{Number(forecast.external_market_price).toFixed(2)}</span>
          </div>
        )}

        {showAnalyst && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <Link 
              href={`/analysts/${forecast.analyst_username}`} 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={forecast.analyst_avatar || undefined} />
                <AvatarFallback className="text-[10px]">
                  {(forecast.analyst_name || forecast.analyst_username).slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground hover:text-foreground">
                {forecast.analyst_name || forecast.analyst_username}
              </span>
            </Link>

            {onFollow && (
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "secondary"}
                className="h-7 px-3 text-xs"
                onClick={() => onFollow(forecast.user_id)}
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center justify-between border-t mt-auto py-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {isResolved ? "Resolved " : "Resolves "}
            {formatDate(forecast.target_date)}
          </span>
          {daysUntil !== null && daysUntil > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400">· {daysUntil}d left</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          <span>{forecast.comment_count}</span>
        </div>
      </CardFooter>
    </Card>
  )
}
