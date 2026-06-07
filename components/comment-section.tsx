"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { addComment } from "@/lib/actions/forecasts"
import { toast } from "sonner"
import { formatDateTime } from "@/lib/utils"
import type { Comment } from "@/types"

interface CommentSectionProps {
  forecastId: string
  initialComments: Comment[]
  isAuthenticated: boolean
}

export function CommentSection({ forecastId, initialComments, isAuthenticated }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return

    setSubmitting(true)
    const result = await addComment(forecastId, content)

    if (result.error) {
      toast.error(result.error)
    } else {
      // Optimistic: append a placeholder (real data will come on revalidate)
      const temp: Comment = {
        id: "temp-" + Date.now(),
        forecast_id: forecastId,
        user_id: "me",
        content: content.trim(),
        created_at: new Date().toISOString(),
        username: "You",
      }
      setComments([temp, ...comments])
      setContent("")
      toast.success("Comment posted")
    }
    setSubmitting(false)
  }

  return (
    <div>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        Discussion <span className="text-muted-foreground font-normal">({comments.length})</span>
      </h3>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <Textarea
            placeholder="Share your thoughts or additional context..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[92px] mb-2"
            disabled={submitting}
            maxLength={2000}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{content.length}/2000</span>
            <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
              {submitting ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 border rounded-lg bg-muted/30 text-sm text-muted-foreground">
          Sign in to join the discussion.
        </div>
      )}

      <div className="space-y-6">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No comments yet. Be the first to discuss this forecast.</p>
        )}
        {comments.map((c, idx) => (
          <div key={c.id + idx} className="flex gap-3">
            <Avatar className="h-8 w-8 mt-0.5">
              <AvatarImage src={c.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{(c.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 text-sm">
                <span className="font-medium">{c.full_name || c.username || "Analyst"}</span>
                <span className="text-muted-foreground text-xs">· {formatDateTime(c.created_at)}</span>
              </div>
              <p className="mt-1 text-[15px] leading-snug whitespace-pre-wrap">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
