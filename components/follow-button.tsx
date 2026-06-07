"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toggleFollow } from "@/lib/actions/follows"
import { toast } from "sonner"

export function FollowButton({ targetUserId, initialIsFollowing }: { targetUserId: string; initialIsFollowing: boolean }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    setIsLoading(true)
    const result = await toggleFollow(targetUserId)
    setIsLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      setIsFollowing(!isFollowing)
      toast.success(isFollowing ? "Unfollowed" : "Following analyst")
    }
  }

  return (
    <Button 
      onClick={handleClick} 
      disabled={isLoading} 
      variant={isFollowing ? "outline" : "default"} 
      className="w-full"
    >
      {isLoading ? "..." : isFollowing ? "Following" : "Follow analyst"}
    </Button>
  )
}
