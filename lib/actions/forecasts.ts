"use server"

import { createClient } from "@/lib/supabase/server"
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be signed in" }
  }

  const parsed = createForecastSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    target_date: formData.get("target_date"),
    predicted_outcome: formData.get("predicted_outcome"),
    initial_confidence: formData.get("initial_confidence"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid data" }
  }

  const insertData: any = {
    user_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    target_date: parsed.data.target_date,
    predicted_outcome: parsed.data.predicted_outcome,
    initial_confidence: parsed.data.initial_confidence,
  }

  // Attach external reference if provided (Polymarket etc.)
  if (parsed.data.external_source) {
    insertData.external_source = parsed.data.external_source
    insertData.external_id = parsed.data.external_id || null
    insertData.external_slug = parsed.data.external_slug || null
    insertData.external_market_price = parsed.data.external_market_price ?? null
    insertData.external_url = parsed.data.external_url || null
  }

  const { error } = await supabase.from("forecasts").insert(insertData)

  if (error) {
    console.error(error)
    return { error: "Failed to create forecast. Please try again." }
  }

  revalidatePath("/forecasts")
  revalidatePath("/dashboard")
  redirect("/dashboard")
}

const resolveSchema = z.object({
  forecast_id: z.string().uuid(),
  resolved_outcome: z.string().min(1),
})

export async function resolveForecast(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be signed in to resolve forecasts")
  }

  const parsed = resolveSchema.safeParse({
    forecast_id: formData.get("forecast_id"),
    resolved_outcome: formData.get("resolved_outcome"),
  })

  if (!parsed.success) {
    throw new Error("Invalid resolution data")
  }

  // Verify ownership and status
  const { data: forecast } = await supabase
    .from("forecasts")
    .select("user_id, status, predicted_outcome")
    .eq("id", parsed.data.forecast_id)
    .single()

  if (!forecast || forecast.user_id !== user.id) {
    throw new Error("You can only resolve your own forecasts")
  }
  if (forecast.status === "resolved") {
    throw new Error("This forecast is already resolved")
  }

  const isCorrect = forecast.predicted_outcome.toLowerCase().trim() === 
                    parsed.data.resolved_outcome.toLowerCase().trim()

  const { error } = await supabase
    .from("forecasts")
    .update({
      status: "resolved",
      resolved_outcome: parsed.data.resolved_outcome,
      is_correct: isCorrect,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", parsed.data.forecast_id)

  if (error) {
    throw new Error("Failed to resolve forecast")
  }

  revalidatePath(`/forecasts/${parsed.data.forecast_id}`)
  revalidatePath("/forecasts")
  revalidatePath("/leaderboard")
  revalidatePath("/dashboard")

  // Redirect back to the forecast detail page to show updated state
  redirect(`/forecasts/${parsed.data.forecast_id}`)
}

export async function addComment(forecastId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "You must be logged in to comment" }
  if (!content || content.trim().length < 1) return { error: "Comment cannot be empty" }

  const { error } = await supabase.from("comments").insert({
    forecast_id: forecastId,
    user_id: user.id,
    content: content.trim().slice(0, 2000),
  })

  if (error) return { error: "Failed to post comment" }

  revalidatePath(`/forecasts/${forecastId}`)
  return { success: true }
}
