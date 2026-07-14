import { TrendingUp, TrendingDown } from 'lucide-react'
import type { HistoryItem as HistoryItemType } from '../../types'
import { formatMoney } from '../../lib/utils'

interface HistoryItemProps {
  item: HistoryItemType
}

export default function HistoryItem({ item }: HistoryItemProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        {item.type === 'sale' ? (
          <TrendingUp size={20} color="#22C55E" />
        ) : (
          <TrendingDown size={20} color="#EF4444" />
        )}
        <div>
          <div className="text-sm text-white">{item.product_name}</div>
          <div className="text-xs text-[#737373]">
            {new Date(item.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium" style={{ color: item.type === 'sale' ? '#22C55E' : '#EF4444' }}>
          {item.type === 'sale' ? '+' : '-'}{formatMoney(item.total)}
        </div>
        <div className="text-xs text-[#737373]">×{item.quantity}</div>
      </div>
    </div>
  )
}
