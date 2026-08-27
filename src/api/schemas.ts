import { z } from 'zod'

/**
 * Strict Zod schema for {@link import('../types/price').PriceData}.
 * All fields are required. Extra properties are stripped.
 */
export const PriceDataSchema = z.object({
  assetPair: z.string().min(1),
  price: z.number().finite(),
  timestamp: z.number().int().min(0),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string().min(1)),
})

/**
 * Strict Zod schema for {@link import('../types/price').PriceHistoryEntry}.
 * All fields are required. Extra properties are stripped.
 */
export const PriceHistoryEntrySchema = z.object({
  price: z.number().finite(),
  timestamp: z.number().int().min(0),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string().min(1)),
})

export const PriceHistoryResponseSchema = z.object({
  pair: z.string(),
  history: z.array(PriceHistoryEntrySchema),
})

export const BatchHistoryResponseSchema = z.array(PriceHistoryResponseSchema)

export const HealthSchema = z.object({
  status: z.string(),
  uptime: z.number(),
})

/**
 * Strict Zod schema for {@link import('../types/onchain').OnChainPriceRecord}.
 * All fields are required. Extra properties are stripped.
 */
export const OnChainPriceRecordSchema = z.object({
  asset: z.string().min(1),
  network: z.enum(['mainnet', 'testnet', 'futurenet']),
  contractId: z.string().min(1),
  price: z.number().finite(),
  publishedAt: z.number().int().min(0),
  ledger: z.number().int().min(0),
})

// ── Alert schema (localStorage deserialization) ──────────────────────────────

export const AlertSchema = z.object({
  id: z.string(),
  assetPair: z.string(),

  // Absolute threshold fields
  upperThreshold: z.number().nullable(),
  lowerThreshold: z.number().nullable(),

  // Alert type: one-time vs persistent (#312)
  triggerOnce: z.boolean(),
  fireCount: z.number().int().min(0).default(0),

  // Percentage-based alert fields (#307)
  percentageMode: z.boolean().default(false),
  percentageThreshold: z.number().nullable().default(null),
  percentageWindow: z.enum(['5min', '15min', '1hr', '24hr']).nullable().default(null),
  percentageDirection: z.enum(['up', 'down', 'either']).nullable().default(null),
  percentageRelativeTo: z.enum(['open', 'previousClose', 'movingAverage']).nullable().default(null),
  percentageBaselinePrice: z.number().nullable().default(null),
  percentageBaselineTimestamp: z.number().nullable().default(null),

  // Snooze fields (#313)
  snoozedUntil: z.number().nullable().default(null),

  // Cooldown (#310) — minutes between re-fires of a persistent alert
  cooldownMinutes: z.number().min(0).default(5),

  // State fields
  active: z.boolean(),
  createdAt: z.number(),
  lastTriggeredAt: z.number().nullable(),
})

export const AlertsArraySchema = z.array(AlertSchema)

// ── Alert history schema (localStorage deserialization, #309) ────────────────

export const AlertHistoryEntrySchema = z.object({
  id: z.string(),
  alertId: z.string(),
  assetPair: z.string(),
  triggeredAt: z.number(),
  price: z.number(),
  triggerOnce: z.boolean(),
  percentageMode: z.boolean().default(false),
  upperThreshold: z.number().nullable().default(null),
  lowerThreshold: z.number().nullable().default(null),
  percentageThreshold: z.number().nullable().default(null),
  percentageWindow: z.enum(['5min', '15min', '1hr', '24hr']).nullable().default(null),
  percentageDirection: z.enum(['up', 'down', 'either']).nullable().default(null),
})

export const AlertHistoryArraySchema = z.array(AlertHistoryEntrySchema)

// ── WebSocket message schemas ────────────────────────────────────────────────

export const WsPriceUpdateSchema = z.object({
  type: z.literal('price_update'),
  assetPair: z.string(),
  price: z.number(),
  timestamp: z.number(),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string()),
  /** Optional monotonic sequence number for duplicate detection. */
  seq: z.number().optional(),
})

/**
 * Discriminated union of all known WebSocket message types.
 * Add new variants here as the server protocol evolves.
 */
export const WsMessageSchema = z.discriminatedUnion('type', [WsPriceUpdateSchema])

// ── Type inference from schemas ──────────────────────────────────────────────

export type PriceDataFromSchema = z.infer<typeof PriceDataSchema>
export type PriceHistoryResponseFromSchema = z.infer<typeof PriceHistoryResponseSchema>
export type BatchHistoryResponseFromSchema = z.infer<typeof BatchHistoryResponseSchema>
export type AlertFromSchema = z.infer<typeof AlertSchema>
export type AlertHistoryEntryFromSchema = z.infer<typeof AlertHistoryEntrySchema>
export type WsMessageFromSchema = z.infer<typeof WsMessageSchema>
