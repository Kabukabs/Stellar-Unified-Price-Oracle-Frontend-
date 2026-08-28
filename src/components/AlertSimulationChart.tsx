/**
 * @file AlertSimulationChart (#490)
 *
 * Renders the result of `simulateAlert` as a compact mini-chart whose line is the
 * replayed synthetic series, with markers at every point where the alert's
 * condition evaluated true. Uses the same recharts primitives as `PriceChart`.
 *
 * Intentionally read-only and stateless — it only ever receives the already-computed
 * simulation output and is shown inside `AlertModal` as a visual preview. It never
 * writes to alert state or history.
 */
import { memo, useMemo, type ReactElement } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipProps } from 'recharts'
import { formatPriceShort } from '../utils/format'
import type { SimulatedPoint } from '../utils/alertSimulation'

interface Props {
  points: SimulatedPoint[]
}

interface Row {
  idx: number
  price: number
  fired: number | null
}

function SimTooltip({ active, payload }: TooltipProps<number, string>): ReactElement | null {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0]?.payload as Row | undefined
  if (!row) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs shadow-lg">
      <span className="text-gray-400">#{row.idx}</span>{' '}
      <span className="text-white font-mono">${formatPriceShort(row.price)}</span>
      {row.fired !== null && (
        <span className={row.fired !== null && row.fired > 0 ? 'ml-1.5 text-green-400' : 'ml-1.5 text-gray-500'}>
          {row.fired !== null && row.fired > 0 ? '● fired' : '· not fired'}
        </span>
      )}
    </div>
  )
}

export const AlertSimulationChart = memo(function AlertSimulationChart({ points }: Props): ReactElement {
  const rows = useMemo<Row[]>(
    () =>
      points.map((p) => ({
        idx: p.index,
        price: p.price,
        fired: p.fired ? 1 : null,
      })),
    [points],
  )

  const firedCount = useMemo(() => points.filter((p) => p.fired).length, [points])

  return (
    <div>
      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
            <defs>
              <linearGradient id="simGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="idx"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={{ stroke: '#1f2937' }}
              tickLine={false}
              label={{ value: 'step', position: 'insideBottomRight', offset: -2, fill: '#6b7280', fontSize: 10 }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${formatPriceShort(v)}`}
              width={70}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<SimTooltip />} />
            <ReferenceLine y={0} stroke="transparent" />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#22d3ee"
              strokeWidth={1.5}
              fill="url(#simGradient)"
              dot={(props: { cx: number; cy: number; index: number; payload: Row }) => {
                const { cx, cy, payload: row, index } = props
                const show = row.fired !== null && row.fired > 0
                return (
                  <g>
                    <line
                      x1={cx}
                      y1={cy}
                      x2={cx}
                      y2="110"
                      stroke={show ? '#22d3ee' : 'transparent'}
                      strokeDasharray="3 2"
                      strokeOpacity={0.35}
                    />
                    {show && (
                      <circle cx={cx} cy={cy} r={3} fill="#22d3ee" stroke="#e0f2fe" strokeWidth={1}>
                        <title>{`Step ${index}: fired at $${row.price}`}</title>
                      </circle>
                    )}
                  </g>
                )
              }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-blue-300 mt-1">
        {firedCount > 0
          ? `Simulated fire: alert triggers at ${firedCount} point${firedCount === 1 ? '' : 's'} in this replay.`
          : 'No simulated fire — the current settings would not trigger on this replay.'}
      </p>
    </div>
  )
})