import type { PriceData, PriceHistoryResponse, PriceProof } from '../types'
import { VALID_PAIRS } from '../types'
import { getStellarAssetForPair } from '../lib/stellarAssets'
import { config } from '../config'

const SOURCES = ['chainlink', 'redstone', 'band', 'reflector'] as const

function randomPrice(base: number) {
  return +(base * (0.98 + Math.random() * 0.04)).toFixed(6)
}

const BASE_PRICES: Record<string, number> = {
  'XLM/USD': 0.12,
  'BTC/USD': 65000,
  'ETH/USD': 3200,
  'USDC/USD': 1.0,
}

export function mockPriceData(pair = 'XLM/USD'): PriceData {
  return {
    assetPair: pair,
    price: randomPrice(BASE_PRICES[pair] ?? 1),
    timestamp: Date.now(),
    confidence: 0.92 + Math.random() * 0.08,
    sources: SOURCES.slice(0, 2 + Math.floor(Math.random() * 3)),
  }
}

export function mockAllPrices(): PriceData[] {
  return VALID_PAIRS.map(mockPriceData)
}

const HEX_CHARS = '0123456789abcdef'

function randomHex(byteLength: number): string {
  let out = ''
  for (let i = 0; i < byteLength * 2; i++) {
    out += HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]
  }
  return out
}

/**
 * Mock on-chain proof for the Proof tab, gated behind {@link getStellarAssetForPair}:
 * only pairs with a canonical on-chain Stellar asset can have a Soroban oracle
 * record, so pairs like `BTC/USD` (aggregated off-chain, no canonical asset)
 * resolve to `null` here exactly as the real `/proof` endpoint would (see
 * docs/adr/0001-onchain-soroban-price-oracle.md and fetchPriceProof's 404 contract).
 */
export function mockPriceProof(pair: string, timestamp?: number): PriceProof | null {
  if (!getStellarAssetForPair(pair)) return null

  const base = BASE_PRICES[pair] ?? 1
  const price = randomPrice(base)
  const recordTimestamp = timestamp ?? Date.now()
  const sources = SOURCES.slice(0, 3)

  return {
    record: {
      assetPair: pair,
      price,
      priceScaled: String(Math.round(price * 1e7)),
      priceDecimals: 7,
      timestamp: recordTimestamp,
      confidence: 0.92 + Math.random() * 0.08,
      sources,
      version: Math.floor(recordTimestamp / 10_000),
    },
    contributions: sources.map((source) => ({
      source,
      price: randomPrice(base),
      timestamp: recordTimestamp - Math.floor(Math.random() * 2000),
      signature: randomHex(64),
      publicKey: randomHex(32),
    })),
    aggregateSignature: randomHex(64),
    contractId: `C${randomHex(28).toUpperCase()}`,
    ledgerSequence: 1_000_000 + Math.floor(Math.random() * 500_000),
    transactionHash: randomHex(32),
    network: config.stellarNetwork,
  }
}

export function mockHistory(pair: string, count = 100): PriceHistoryResponse {
  const base = BASE_PRICES[pair] ?? 1
  const now = Date.now()
  return {
    pair,
    history: Array.from({ length: count }, (_, i) => ({
      price: randomPrice(base),
      timestamp: now - (count - i) * 60_000,
      confidence: 0.9 + Math.random() * 0.1,
      sources: SOURCES.slice(0, 2),
    })),
  }
}
