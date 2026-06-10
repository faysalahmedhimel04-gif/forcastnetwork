import type { Market, MarketCategory } from '@/types'

// FIFA World Cup 2026 - June 11 – July 19, 2026 (USA, Canada, Mexico)
// All markets are for demonstration / fake trading with USDC. Not real money.

export const MOCK_MARKETS: Market[] = [
  {
    id: 'wc26-winner-arg',
    title: 'Argentina to win the 2026 FIFA World Cup',
    description: 'Will Argentina lift the trophy in the 2026 World Cup final?',
    category: 'Winner',
    yesPrice: 0.28,
    noPrice: 0.74,
    volume: 1248000,
    endDate: '2026-07-19T20:00:00Z',
    resolved: false,
  },
  {
    id: 'wc26-winner-bra',
    title: 'Brazil to win the 2026 FIFA World Cup',
    description: 'Will Brazil claim their 6th World Cup title?',
    category: 'Winner',
    yesPrice: 0.19,
    noPrice: 0.82,
    volume: 987000,
    endDate: '2026-07-19T20:00:00Z',
    resolved: false,
  },
  {
    id: 'wc26-winner-fra',
    title: 'France to win the 2026 FIFA World Cup',
    description: 'Will France win back-to-back World Cups?',
    category: 'Winner',
    yesPrice: 0.15,
    noPrice: 0.86,
    volume: 756000,
    endDate: '2026-07-19T20:00:00Z',
    resolved: false,
  },
  {
    id: 'wc26-winner-eng',
    title: 'England to win the 2026 FIFA World Cup',
    description: 'Will England finally win the World Cup again?',
    category: 'Winner',
    yesPrice: 0.12,
    noPrice: 0.89,
    volume: 643000,
    endDate: '2026-07-19T20:00:00Z',
    resolved: false,
  },
  {
    id: 'wc26-golden-boot-mbappe',
    title: 'Kylian Mbappé to win the Golden Boot',
    description: 'Will Kylian Mbappé be the tournament\'s top scorer?',
    category: 'Golden Boot',
    yesPrice: 0.34,
    noPrice: 0.68,
    volume: 421000,
    endDate: '2026-07-19T20:00:00Z',
    resolved: false,
  },
  {
    id: 'wc26-golden-boot-haaland',
    title: 'Erling Haaland to win the Golden Boot',
    description: 'Will Haaland finish as the leading goal scorer in 2026?',
    category: 'Golden Boot',
    yesPrice: 0.22,
    noPrice: 0.79,
    volume: 298000,
    endDate: '2026-07-19T20:00:00Z',
    resolved: false,
  },
  {
    id: 'wc26-semis-eng',
    title: 'England to reach the semi-finals',
    description: 'Will England make it to the final four in the United States?',
    category: 'To Reach Final',
    yesPrice: 0.61,
    noPrice: 0.41,
    volume: 312000,
    endDate: '2026-07-10T18:00:00Z',
    resolved: false,
  },
  {
    id: 'wc26-final-arg-fra',
    title: 'Argentina vs France in the final',
    description: 'Will we see a rematch of the 2022 final?',
    category: 'To Reach Final',
    yesPrice: 0.18,
    noPrice: 0.83,
    volume: 187000,
    endDate: '2026-07-14T20:00:00Z',
    resolved: false,
  },
  {
    id: 'wc26-group-bra',
    title: 'Brazil to top Group G',
    description: 'Will Brazil finish first in their group stage?',
    category: 'Group Stage',
    yesPrice: 0.72,
    noPrice: 0.29,
    volume: 145000,
    endDate: '2026-06-26T21:00:00Z',
    resolved: false,
  },
  {
    id: 'wc26-match-usa-mex',
    title: 'USA to beat Mexico (Group Stage)',
    description: 'Will the United States defeat Mexico in their group stage clash?',
    category: 'Match Winner',
    yesPrice: 0.47,
    noPrice: 0.54,
    volume: 98000,
    endDate: '2026-06-19T19:00:00Z',
    resolved: false,
  },
  {
    id: 'wc26-top-scorer-kane',
    title: 'Harry Kane to score 5+ goals',
    description: 'Will Harry Kane net 5 or more goals during the tournament?',
    category: 'Top Scorer',
    yesPrice: 0.39,
    noPrice: 0.62,
    volume: 167000,
    endDate: '2026-07-19T20:00:00Z',
    resolved: false,
  },
  {
    id: 'wc26-host-usa',
    title: 'USA to reach the quarter-finals',
    description: 'Will the co-host United States make the last 8?',
    category: 'To Reach Final',
    yesPrice: 0.44,
    noPrice: 0.57,
    volume: 134000,
    endDate: '2026-07-04T18:00:00Z',
    resolved: false,
  },
]

export function getMockMarkets(): Market[] {
  // Return a fresh copy so the store can mutate prices without affecting the seed
  return JSON.parse(JSON.stringify(MOCK_MARKETS))
}

export function getMarketById(id: string): Market | undefined {
  return MOCK_MARKETS.find((m) => m.id === id)
}

export const MARKET_CATEGORIES: MarketCategory[] = [
  'Winner',
  'Match Winner',
  'Golden Boot',
  'To Reach Final',
  'Group Stage',
  'Top Scorer',
  'Other',
]
