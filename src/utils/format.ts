/** Formats a price with variable decimal precision: 2 dp for ≥1000, 4 dp for ≥1, 6–8 dp otherwise. */
export function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
  return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 })
}

/** Same scale tiers as {@link formatPrice} but without a fixed maximum decimal count (for chart labels). */
export function formatPriceShort(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2 })
  if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 4 })
  return price.toLocaleString('en-US', { minimumFractionDigits: 6 })
}

/** Returns a human-readable relative time string (e.g. "5s ago", "2m ago") from a Unix timestamp in ms. */
export function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  return `${Math.floor(min / 60)}h ago`
}

/** Formats a Unix timestamp in ms as a localised short datetime string. */
export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Formats a Unix timestamp in ms as "HH:MM" for chart x-axis labels. */
export function formatChartTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Formats a Unix timestamp in ms for chart x-axis labels using the given IANA
 * timezone identifier (or 'UTC' / 'Local').
 * Returns "HH:MM" format with the timezone abbreviation appended when it is
 * different from the browser local timezone.
 */
export function formatChartTimeWithTz(ts: number, timezone: string): string {
  const tz = timezone === 'Local' ? undefined : timezone
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
  })
}

/**
 * Returns the short timezone abbreviation (e.g. "UTC", "EST", "JST") for a
 * given IANA timezone string and a reference timestamp. Falls back to the raw
 * timezone value if the Intl API is unavailable.
 */
export function getTimezoneAbbr(timezone: string, ts = Date.now()): string {
  if (timezone === 'Local') {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(ts)
      return parts.find((p) => p.type === 'timeZoneName')?.value ?? 'Local'
    } catch {
      return 'Local'
    }
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).formatToParts(ts)
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? timezone
  } catch {
    return timezone
  }
}

/** Formats a price value for chart y-axis tick labels using the same scale tiers as {@link formatPrice}. */
export function formatChartPrice(val: number): string {
  if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2 })
  if (val >= 1) return val.toLocaleString('en-US', { minimumFractionDigits: 4 })
  return val.toLocaleString('en-US', { minimumFractionDigits: 6 })
}
