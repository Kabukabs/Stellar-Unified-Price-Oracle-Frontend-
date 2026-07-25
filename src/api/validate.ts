import type { ZodTypeAny, z } from 'zod'

/**
 * Validates `data` against `schema` and always returns the inferred type.
 *
 * **Behavior:**
 * - In development and test: validation runs on every call; a warning is logged
 *   on mismatch but the raw data is returned so the UI degrades gracefully.
 * - In production: validation runs on every call.  The old 5% sampling bypass
 *   has been removed; the performance cost is negligible compared to the
 *   network round-trip and the safety benefit is significant.
 *
 * If you intentionally want to skip validation for a hot-path, pass the data
 * through directly — don't re-introduce the sampling bypass.
 */
export function validate<S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues
      .map((i: { path: (string | number)[]; message: string }) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    console.warn(`[API validation] Schema mismatch — ${message}`)
    // Return data anyway to avoid breaking the UI on unexpected server responses
  }
  return data as z.infer<S>
}
