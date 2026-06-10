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

// ============================================
// FIFA World Cup 2026 Prediction Market Types
// ============================================

export type MarketCategory =
  | 'Winner'
  | 'Match Winner'
  | 'Golden Boot'
  | 'To Reach Final'
  | 'Group Stage'
  | 'Top Scorer'
  | 'Other'

export type Market = {
  id: string
  title: string
  description: string
  category: MarketCategory
  yesPrice: number // e.g. 0.68 = 68¢ for Yes
  noPrice: number
  volume: number // total traded volume (fake USDC)
  endDate: string // ISO date string
  resolved: boolean
  resolvedOutcome?: 'yes' | 'no' | null
}

export type Position = {
  marketId: string
  side: 'yes' | 'no'
  shares: number
  avgPrice: number // weighted average entry price
}

export type Trade = {
  id: string
  marketId: string
  marketTitle: string
  side: 'yes' | 'no'
  shares: number
  price: number
  cost: number // signed: positive = spent USDC on buy, negative = received on sell
  type: 'buy' | 'sell'
  timestamp: string
}

export type UserPortfolio = {
  balance: number // fake USDC
  positions: Position[]
  trades: Trade[]
}

// Helper to format prices nicely
export const formatPrice = (price: number) => (price * 100).toFixed(1) + '¢'
export const formatShares = (shares: number) => shares.toLocaleString()
export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
