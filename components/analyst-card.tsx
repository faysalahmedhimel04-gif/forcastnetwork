"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toggleFollow } from "@/lib/actions/follows"
import { toast } from "sonner"
import type { Profile } from "@/types"

interface AnalystCardProps {
  analyst: Profile & { is_following?: boolean }
  onFollowToggle?: (id: string) => void
  currentUserId?: string
}

export function AnalystCard({ analyst, onFollowToggle, currentUserId }: AnalystCardProps) {
  const isOwnProfile = currentUserId === analyst.id
  const [isFollowing, setIsFollowing] = useState(analyst.is_following ?? false)
  const [loading, setLoading] = useState(false)

  async function handleFollow() {
    if (onFollowToggle) {
      onFollowToggle(analyst.id)
      return
    }
    // Built-in follow handling (works on server lists too)
    setLoading(true)
    const res = await toggleFollow(analyst.id)
    setLoading(false)
    if (res?.error) {
      toast.error(res.error)
    } else {
      setIsFollowing(!isFollowing)
      toast.success(isFollowing ? "Unfollowed" : "Now following analyst")
    }
  }

  return (
    <Card className="hover:border-accent/50 transition-colors">
      <CardContent className="p-5">
        <div className="flex gap-4">
          <Link href={`/analysts/${analyst.username}`}>
            <Avatar className="h-12 w-12 ring-1 ring-border">
              <AvatarImage src={analyst.avatar_url || undefined} />
              <AvatarFallback className="bg-accent/10 text-accent text-base">
                {(analyst.full_name || analyst.username).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/analysts/${analyst.username}`} className="font-semibold hover:text-accent transition-colors">
                  {analyst.full_name || analyst.username}
                </Link>
                <div className="text-sm text-muted-foreground">@{analyst.username}</div>
              </div>

              {!isOwnProfile && (
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollow}
                  disabled={loading}
                  className="h-8 px-3 text-xs shrink-0"
                >
                  {loading ? "..." : isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>

            {analyst.bio && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{analyst.bio}</p>
            )}

            <div className="mt-3 flex items-center gap-3 text-sm">
              <div>
                <span className="font-semibold tabular-nums">{analyst.accuracy.toFixed(1)}%</span>
                <span className="text-muted-foreground ml-1">accuracy</span>
              </div>
              <div className="text-muted-foreground">·</div>
              <div>
                <span className="font-semibold tabular-nums">{analyst.total_forecasts}</span>
                <span className="text-muted-foreground ml-1">forecasts</span>
              </div>
              <div className="text-muted-foreground">·</div>
              <div>
                <span className="font-semibold tabular-nums">{analyst.follower_count}</span>
                <span className="text-muted-foreground ml-1">followers</span>
              </div>
            </div>

            {analyst.expertise_areas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {analyst.expertise_areas.slice(0, 3).map((area) => (
                  <Badge key={area} variant="secondary" className="text-[10px] px-2 py-px">
                    {area}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
