// Polymarket Gamma API integration
// https://gamma-api.polymarket.com
// Used for reference data only. This platform does NOT support betting or trading.

const GAMMA_BASE = "https://gamma-api.polymarket.com"

export type RawPolymarketMarket = {
  id: string
  slug: string
  question: string
  description?: string
  endDate: string
  active: boolean
  closed: boolean
  lastTradePrice?: number
  volumeNum?: number
  liquidityNum?: number
  category?: string
  image?: string
}

export async function fetchPolymarketMarkets(options: {
  limit?: number
  active?: boolean
  closed?: boolean
  search?: string
} = {}): Promise<RawPolymarketMarket[]> {
  const { limit = 20, active = true, closed = false, search } = options

  const params = new URLSearchParams({
    limit: String(limit),
    active: String(active),
    closed: String(closed),
    order: "volume",
    ascending: "false",
  })

  if (search) {
    params.set("search", search)
  }

  const url = `${GAMMA_BASE}/markets?${params.toString()}`

  const res = await fetch(url, {
    next: { revalidate: 60 }, // cache for 1 minute on server
    headers: {
      "Accept": "application/json",
    },
  })

  if (!res.ok) {
    console.error("Polymarket Gamma API error", res.status)
    return []
  }

  const data: RawPolymarketMarket[] = await res.json()
  return Array.isArray(data) ? data : []
}

export function normalizePolymarketMarket(raw: RawPolymarketMarket) {
  const price = typeof raw.lastTradePrice === "number" ? raw.lastTradePrice : null

  return {
    id: raw.id,
    slug: raw.slug,
    question: raw.question,
    description: raw.description,
    category: raw.category || "Other",
    endDate: raw.endDate,
    lastTradePrice: price,
    volume: typeof raw.volumeNum === "number" ? raw.volumeNum : null,
    liquidity: typeof raw.liquidityNum === "number" ? raw.liquidityNum : null,
    active: raw.active,
    closed: raw.closed,
    url: `https://polymarket.com/markets/${raw.slug}`,
  }
}

export async function getTrendingPolymarketMarkets(limit = 6) {
  const raw = await fetchPolymarketMarkets({ limit, active: true, closed: false })
  return raw.map(normalizePolymarketMarket).slice(0, limit)
}

export async function getPolymarketMarketBySlug(slug: string) {
  const params = new URLSearchParams({ slug })
  const res = await fetch(`${GAMMA_BASE}/markets?${params.toString()}`, {
    next: { revalidate: 30 },
  })

  if (!res.ok) return null
  const data = await res.json()
  const market = Array.isArray(data) ? data[0] : data
  return market ? normalizePolymarketMarket(market) : null
}
