"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const createForecastSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(20),
  category: z.string().min(2),
  target_date: z.string().refine((d) => new Date(d) > new Date(), "Resolution date must be in the future"),
  predicted_outcome: z.string().min(1).max(120),
  initial_confidence: z.coerce.number().min(1).max(100),

  // Optional Polymarket / external reference linking (reference only)
  external_source: z.string().optional(),
  external_id: z.string().optional(),
  external_slug: z.string().optional(),
  external_market_price: z.coerce.number().optional(),
  external_url: z.string().optional(),
})

export async function createForecast(formData: FormData) {
  // Use the dedicated backend API instead of direct Supabase insert.
  // The backend handles validation, auth, and database writes.
  const { api } = await import('@/lib/api')

  try {
    const payload = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      target_date: formData.get("target_date"),
      predicted_outcome: formData.get("predicted_outcome"),
      initial_confidence: Number(formData.get("initial_confidence")),
      external_source: formData.get("external_source") || undefined,
      external_id: formData.get("external_id") || undefined,
      external_slug: formData.get("external_slug") || undefined,
      external_market_price: formData.get("external_market_price")
        ? Number(formData.get("external_market_price"))
        : undefined,
      external_url: formData.get("external_url") || undefined,
    }

    await api.post('/api/forecasts', payload)

    revalidatePath("/forecasts")
    revalidatePath("/dashboard")
    redirect("/dashboard")
  } catch (error: any) {
    console.error(error)
    return { error: error.message || "Failed to create forecast. Please try again." }
  }
}

const resolveSchema = z.object({
  forecast_id: z.string().uuid(),
  resolved_outcome: z.string().min(1),
})

export async function resolveForecast(formData: FormData) {
  // Delegate to the backend API
  const { api } = await import('@/lib/api')

  try {
    const payload = {
      resolved_outcome: formData.get("resolved_outcome"),
    }

    const forecastId = formData.get("forecast_id")
    await api.patch(`/api/forecasts/${forecastId}`, payload)

    revalidatePath(`/forecasts/${forecastId}`)
    revalidatePath("/forecasts")
    revalidatePath("/leaderboard")
    revalidatePath("/dashboard")

    redirect(`/forecasts/${forecastId}`)
  } catch (error: any) {
    throw new Error(error.message || "Failed to resolve forecast")
  }
}

export async function addComment(forecastId: string, content: string) {
  const { api } = await import('@/lib/api')

  try {
    await api.post('/api/comments', {
      forecast_id: forecastId,
      content: content.trim().slice(0, 2000),
    })

    revalidatePath(`/forecasts/${forecastId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message || "Failed to post comment" }
  }
}
