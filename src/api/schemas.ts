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

// ── Alert schema (localStorage deserialization) ──────────────────────────────

export const AlertSchema = z.object({
  id: z.string(),
  assetPair: z.string(),
  upperThreshold: z.number().nullable(),
  lowerThreshold: z.number().nullable(),
  triggerOnce: z.boolean(),
  active: z.boolean(),
  createdAt: z.number(),
  lastTriggeredAt: z.number().nullable(),
})

export const AlertsArraySchema = z.array(AlertSchema)

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
export type WsMessageFromSchema = z.infer<typeof WsMessageSchema>
