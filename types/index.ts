// ForcastNetwork Type Definitions

export type Profile = {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  expertise_areas: string[]
  total_forecasts: number
  correct_forecasts: number
  accuracy: number
  follower_count: number
  created_at: string
  updated_at: string
}

export type Forecast = {
  id: string
  user_id: string
  title: string
  description: string
  category: string
  target_date: string
  predicted_outcome: string
  initial_confidence: number
  status: 'open' | 'resolved'
  resolved_outcome: string | null
  is_correct: boolean | null
  resolved_at: string | null
  resolved_by: string | null
  comment_count: number
  created_at: string
  updated_at: string

  // External reference (e.g. Polymarket) — for transparency only, not trading
  external_source?: string | null
  external_id?: string | null
  external_slug?: string | null
  external_market_price?: number | null
  external_url?: string | null
}

export type ForecastWithAnalyst = Forecast & {
  analyst_username: string
  analyst_name: string | null
  analyst_avatar: string | null
}

export type Comment = {
  id: string
  forecast_id: string
  user_id: string
  content: string
  created_at: string
  // joined
  username?: string
  full_name?: string | null
  avatar_url?: string | null
}

export type Follow = {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export type LeaderboardEntry = {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  accuracy: number
  total_forecasts: number
  correct_forecasts: number
  follower_count: number
  expertise_areas: string[]
}

export const FORECAST_CATEGORIES = [
  "Politics",
  "Technology",
  "Economy",
  "Science",
  "Sports",
  "Entertainment",
  "Business",
  "Weather",
  "Geopolitics",
  "Other",
] as const

export type ForecastCategory = (typeof FORECAST_CATEGORIES)[number]

export type ForecastStatus = "open" | "resolved"

// Polymarket (via Gamma API) — used for reference / anchoring forecasts only
export type PolymarketMarket = {
  id: string
  slug: string
  question: string
  description?: string
  category?: string
  endDate: string
  lastTradePrice: number | null   // 0-1 probability for Yes / primary outcome
  volume: number | null
  liquidity: number | null
  active: boolean
  closed: boolean
  url: string
}
