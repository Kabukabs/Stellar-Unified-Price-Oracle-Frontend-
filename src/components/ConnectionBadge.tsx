import { memo, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import type { RateLimitStatus } from '../api/rateLimit'
import type { ConnectionStatus } from '../api/websocket'
import { Tooltip } from './Tooltip'

interface ConnectionBadgeProps {
  status: ConnectionStatus
  rateLimitStatus?: RateLimitStatus
  retryAfterMs?: number
}

export const ConnectionBadge = memo(function ConnectionBadge({ status, rateLimitStatus, retryAfterMs }: ConnectionBadgeProps): ReactElement {
  const { t } = useTranslation()

  const STATUS_MAP: Record<ConnectionStatus, { label: string; color: string; tooltip: string }> = {
    connected: {
      label: t('connection.live'),
      color: 'bg-green-500',
      tooltip: t('connection.tooltips.connected'),
    },
    connecting: {
      label: t('connection.connecting'),
      color: 'bg-yellow-500',
      tooltip: t('connection.tooltips.connecting'),
    },
    reconnecting: {
      label: t('connection.reconnecting'),
      color: 'bg-yellow-500',
      tooltip: t('connection.tooltips.reconnecting'),
    },
    disconnected: {
      label: t('connection.offline'),
      color: 'bg-red-500',
      tooltip: t('connection.tooltips.disconnected'),
    },
  }

  const s = STATUS_MAP[status]
  const isRateLimited = rateLimitStatus === 'limited'
  const label = isRateLimited
    ? retryAfterMs && retryAfterMs > 0
      ? t('connection.rateLimitedWithTimer', { seconds: Math.ceil(retryAfterMs / 1000) })
      : t('connection.rateLimited')
    : s.label
  const ariaLabel = isRateLimited
    ? t('connection.rateLimitedAriaLabel')
    : t('connection.ariaLabel', { status: s.label })

  return (
    <Tooltip content={isRateLimited ? t('connection.tooltips.rateLimited') : s.tooltip}>
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
        role="status"
        aria-label={ariaLabel}
      >
        <span
          className={`w-2 h-2 rounded-full ${isRateLimited ? 'bg-orange-500' : s.color} ${status === 'connected' && !isRateLimited ? 'animate-pulse' : ''}`}
          aria-hidden="true"
        />
        {label}
      </span>
    </Tooltip>
  )
})
