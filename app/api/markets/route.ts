import { NextRequest, NextResponse } from "next/server"
import { fetchPolymarketMarkets, normalizePolymarketMarket } from "@/lib/polymarket"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100)
  const active = searchParams.get("active") !== "false"
  const closed = searchParams.get("closed") === "true"
  const q = searchParams.get("q") || searchParams.get("search") || undefined

  try {
    const rawMarkets = await fetchPolymarketMarkets({
      limit,
      active,
      closed,
      search: q,
    })

    const markets = rawMarkets.map(normalizePolymarketMarket)

    return NextResponse.json({
      source: "polymarket",
      count: markets.length,
      markets,
    })
  } catch (err) {
    console.error("Failed to fetch Polymarket markets", err)
    return NextResponse.json(
      { error: "Failed to fetch markets from Polymarket", markets: [] },
      { status: 500 }
    )
  }
}
