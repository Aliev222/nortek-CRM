import type { RevenueDay } from '../../types'

interface BarChartProps {
  data: RevenueDay[]
  color?: string
}

/**
 * Лёгкий адаптивный столбчатый график без внешних зависимостей.
 * Высота столбца = value / max. Защита от деления на ноль.
 */
export default function BarChart({ data, color = '#c8ff00' }: BarChartProps) {
  const max = data.reduce((m, d) => Math.max(m, d.value), 0)

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => {
        const heightPct = max > 0 ? (d.value / max) * 100 : 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full rounded-t-md transition-[height] duration-300"
                style={{
                  height: `${Math.max(heightPct, d.value > 0 ? 4 : 0)}%`,
                  backgroundColor: color,
                  opacity: d.value > 0 ? 1 : 0.15,
                }}
              />
            </div>
            <span className="text-[10px] text-[#737373] leading-none">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}
