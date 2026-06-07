"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function toggleFollow(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be signed in to follow analysts" }
  }
  if (user.id === targetUserId) {
    return { error: "You cannot follow yourself" }
  }

  // Check if already following
  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .single()

  if (existing) {
    // Unfollow
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId)

    if (error) return { error: "Failed to unfollow" }
  } else {
    // Follow
    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: targetUserId,
    })
    if (error) return { error: "Failed to follow analyst" }
  }

  revalidatePath("/dashboard")
  revalidatePath("/analysts")
  revalidatePath(`/analysts/*`)
  return { success: true }
}
