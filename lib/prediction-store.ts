import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Market, Position, Trade, MarketCategory } from '@/types'
import { getMockMarkets } from './mock-markets'

interface PredictionState {
  // Fake USDC balance (starts with 10,000 for generous demo trading)
  balance: number

  // Live markets (prices mutate with trading activity)
  markets: Market[]

  // User's current positions
  positions: Position[]

  // Full trade history
  trades: Trade[]

  // Actions
  buyShares: (marketId: string, side: 'yes' | 'no', shares: number) => boolean
  sellShares: (marketId: string, side: 'yes' | 'no', shares: number) => boolean
  getMarket: (marketId: string) => Market | undefined
  getPosition: (marketId: string, side?: 'yes' | 'no') => Position | undefined
  getTotalPnL: () => number
  createMarket: (marketData: {
    title: string
    description: string
    category: MarketCategory
    yesPrice: number
    endDate: string
  }) => string
  resolveMarket: (marketId: string, outcome: 'yes' | 'no') => void
  deleteMarket: (marketId: string) => void
  resetDemo: () => void

  // Internal helpers
  _updateMarketPrice: (marketId: string, side: 'yes' | 'no', delta: number) => void
  _recordTrade: (trade: Omit<Trade, 'id' | 'timestamp' | 'marketTitle'>) => void
}

const INITIAL_BALANCE = 10000

function calculateCost(shares: number, price: number): number {
  return Math.round(shares * price * 100) / 100
}

function clampPrice(price: number): number {
  return Math.max(0.01, Math.min(0.99, Math.round(price * 1000) / 1000))
}

export const usePredictionStore = create<PredictionState>()(
  persist(
    (set, get) => ({
      balance: INITIAL_BALANCE,
      markets: getMockMarkets(),
      positions: [],
      trades: [],

      getMarket: (marketId) => {
        return get().markets.find((m) => m.id === marketId)
      },

      getPosition: (marketId, side) => {
        const positions = get().positions
        if (side) {
          return positions.find((p) => p.marketId === marketId && p.side === side)
        }
        return positions.find((p) => p.marketId === marketId)
      },

      getTotalPnL: () => {
        const { positions, markets } = get()
        return positions.reduce((total, pos) => {
          const market = markets.find((m) => m.id === pos.marketId)
          if (!market) return total

          const currentPrice = pos.side === 'yes' ? market.yesPrice : market.noPrice
          const currentValue = pos.shares * currentPrice
          const costBasis = pos.shares * pos.avgPrice
          return total + (currentValue - costBasis)
        }, 0)
      },

      // Core buy logic (returns success)
      buyShares: (marketId, side, shares) => {
        if (shares <= 0) return false

        const state = get()
        const market = state.markets.find((m) => m.id === marketId)
        if (!market || market.resolved) return false

        const price = side === 'yes' ? market.yesPrice : market.noPrice
        const cost = calculateCost(shares, price)

        if (cost > state.balance) {
          // Not enough balance — caller should show toast
          return false
        }

        const newBalance = Math.round((state.balance - cost) * 100) / 100

        // Update or create position with weighted average
        const existing = state.positions.find(
          (p) => p.marketId === marketId && p.side === side
        )

        let newPositions: Position[]
        if (existing) {
          const totalShares = existing.shares + shares
          const totalCost = existing.shares * existing.avgPrice + cost
          const newAvg = Math.round((totalCost / totalShares) * 1000) / 1000

          newPositions = state.positions.map((p) =>
            p.marketId === marketId && p.side === side
              ? { ...p, shares: totalShares, avgPrice: newAvg }
              : p
          )
        } else {
          newPositions = [
            ...state.positions,
            { marketId, side, shares, avgPrice: price },
          ]
        }

        // Record trade
        const trade: Omit<Trade, 'id' | 'timestamp' | 'marketTitle'> = {
          marketId,
          side,
          shares,
          price,
          cost: +cost, // positive = money spent
          type: 'buy',
        }

        // Price impact — buying pushes the chosen side up
        const impact = Math.min(0.018, Math.max(0.003, shares / 1200))
        const priceDelta = side === 'yes' ? +impact : -impact

        // Apply updates
        set((s) => ({
          balance: newBalance,
          positions: newPositions,
        }))

        get()._recordTrade(trade)
        get()._updateMarketPrice(marketId, side, priceDelta)

        return true
      },

      // Sell logic
      sellShares: (marketId, side, shares) => {
        if (shares <= 0) return false

        const state = get()
        const market = state.markets.find((m) => m.id === marketId)
        if (!market || market.resolved) return false

        const existing = state.positions.find(
          (p) => p.marketId === marketId && p.side === side
        )
        if (!existing || existing.shares < shares) {
          return false // not enough shares
        }

        const price = side === 'yes' ? market.yesPrice : market.noPrice
        const proceeds = calculateCost(shares, price)

        const newBalance = Math.round((state.balance + proceeds) * 100) / 100

        const remainingShares = existing.shares - shares
        let newPositions: Position[]

        if (remainingShares <= 0.001) {
          newPositions = state.positions.filter(
            (p) => !(p.marketId === marketId && p.side === side)
          )
        } else {
          newPositions = state.positions.map((p) =>
            p.marketId === marketId && p.side === side
              ? { ...p, shares: remainingShares }
              : p
          )
        }

        const trade: Omit<Trade, 'id' | 'timestamp' | 'marketTitle'> = {
          marketId,
          side,
          shares,
          price,
          cost: -proceeds, // negative = money received
          type: 'sell',
        }

        // Selling pushes price the opposite way
        const impact = Math.min(0.015, Math.max(0.002, shares / 1400))
        const priceDelta = side === 'yes' ? -impact : +impact

        set((s) => ({
          balance: newBalance,
          positions: newPositions,
        }))

        get()._recordTrade(trade)
        get()._updateMarketPrice(marketId, side, priceDelta)

        return true
      },

      _updateMarketPrice: (marketId, side, delta) => {
        set((state) => {
          const updatedMarkets = state.markets.map((m) => {
            if (m.id !== marketId) return m

            let newYes = m.yesPrice
            let newNo = m.noPrice

            if (side === 'yes') {
              newYes = clampPrice(m.yesPrice + delta)
              newNo = clampPrice(1 - newYes - 0.01) // small spread
            } else {
              newNo = clampPrice(m.noPrice + delta)
              newYes = clampPrice(1 - newNo - 0.01)
            }

            return {
              ...m,
              yesPrice: newYes,
              noPrice: newNo,
              volume: Math.round(m.volume + Math.abs(delta) * 180000),
            }
          })

          return { markets: updatedMarkets }
        })
      },

      _recordTrade: (partialTrade) => {
        const market = get().markets.find((m) => m.id === partialTrade.marketId)
        const fullTrade: Trade = {
          ...partialTrade,
          id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          timestamp: new Date().toISOString(),
          marketTitle: market?.title || 'Unknown Market',
        }

        set((state) => ({
          trades: [fullTrade, ...state.trades].slice(0, 200), // cap history
        }))
      },

      createMarket: (marketData: {
        title: string
        description: string
        category: MarketCategory
        yesPrice: number
        endDate: string
      }) => {
        const newMarket: Market = {
          id: `custom-${Date.now()}`,
          title: marketData.title.trim(),
          description: marketData.description.trim(),
          category: marketData.category,
          yesPrice: clampPrice(marketData.yesPrice),
          noPrice: clampPrice(1 - marketData.yesPrice - 0.01),
          volume: 0,
          endDate: marketData.endDate,
          resolved: false,
        }

        set((state) => ({
          markets: [newMarket, ...state.markets],
        }))

        return newMarket.id
      },

      resolveMarket: (marketId, outcome) => {
        set((state) => {
          const marketIndex = state.markets.findIndex((m) => m.id === marketId)
          if (marketIndex === -1) return state

          const updatedMarkets = [...state.markets]
          const market = { ...updatedMarkets[marketIndex] }
          market.resolved = true
          market.resolvedOutcome = outcome

          // Demo settlement: credit positions that were correct
          let balanceAdjustment = 0
          const updatedPositions = state.positions.map((pos) => {
            if (pos.marketId !== marketId) return pos

            const isCorrect = pos.side === outcome
            if (isCorrect) {
              const payout = pos.shares * 1 // $1 per share on win
              balanceAdjustment += payout
              // Remove winning position (settled)
              return null
            }
            // Losing positions are removed (no payout)
            return null
          }).filter(Boolean) as Position[]

          // Also remove trades related? Keep history but for demo we just adjust balance
          const newBalance = Math.round((state.balance + balanceAdjustment) * 100) / 100

          updatedMarkets[marketIndex] = market

          return {
            markets: updatedMarkets,
            positions: updatedPositions,
            balance: newBalance,
          }
        })
      },

      deleteMarket: (marketId) => {
        set((state) => ({
          markets: state.markets.filter((m) => m.id !== marketId),
          positions: state.positions.filter((p) => p.marketId !== marketId),
          // Keep trades for history but they will be orphaned - fine for demo
        }))
      },

      resetDemo: () => {
        set({
          balance: INITIAL_BALANCE,
          markets: getMockMarkets(),
          positions: [],
          trades: [],
        })
      },
    }),
    {
      name: 'forcastnetwork-prediction-market',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        balance: state.balance,
        markets: state.markets,
        positions: state.positions,
        trades: state.trades,
      }),
    }
  )
)
