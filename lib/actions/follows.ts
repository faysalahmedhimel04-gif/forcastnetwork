"use server"

import { revalidatePath } from "next/cache"

export async function toggleFollow(targetUserId: string) {
  // Use the dedicated backend
  const { api } = await import('@/lib/api')

  try {
    // The backend's /api/follows POST will follow, DELETE will unfollow.
    // For toggle we check current state via a simple approach or always try follow then handle conflict.
    // Simpler: call a toggle endpoint if we add one, or do two calls.
    // For now, we can call POST (follow) and if conflict (409), then DELETE.

    try {
      await api.post('/api/follows', { following_id: targetUserId })
    } catch (err: any) {
      if (err.message?.includes('Already following') || err.message?.includes('409')) {
        // Unfollow instead
        await api.delete(`/api/follows?following_id=${targetUserId}`)
      } else {
        throw err
      }
    }

    revalidatePath("/dashboard")
    revalidatePath("/analysts")
    revalidatePath(`/analysts/*`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to toggle follow" }
  }
}
