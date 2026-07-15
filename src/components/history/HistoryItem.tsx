import { TrendingUp, TrendingDown, RotateCcw } from 'lucide-react'
import type { HistoryItem as HistoryItemType } from '../../types'
import { formatMoney } from '../../lib/utils'

interface HistoryItemProps {
  item: HistoryItemType
  onCancel?: (item: HistoryItemType) => void
  cancelling?: boolean
}

export default function HistoryItem({ item, onCancel, cancelling }: HistoryItemProps) {
  const isReturned = item.status === 'returned'

  return (
    <div className={`flex items-center justify-between px-4 py-3 ${isReturned ? 'opacity-40' : ''}`}>
      <div className="flex items-center gap-3 min-w-0">
        {item.type === 'sale' ? (
          <TrendingUp size={20} color={isReturned ? '#737373' : '#22C55E'} />
        ) : (
          <TrendingDown size={20} color={isReturned ? '#737373' : '#EF4444'} />
        )}
        <div>
          <div className={`text-sm ${isReturned ? 'text-[#737373] line-through' : 'text-white'}`}>
            {item.product_name}
          </div>
          <div className="text-xs text-[#737373]">
            {new Date(item.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <div className={`text-sm font-medium ${isReturned ? 'text-[#737373]' : ''}`} style={isReturned ? {} : { color: item.type === 'sale' ? '#22C55E' : '#EF4444' }}>
            {item.type === 'sale' ? '+' : '-'}{formatMoney(item.total)}
          </div>
          <div className="text-xs text-[#737373]">×{item.quantity}</div>
        </div>
        {!isReturned && onCancel && (
          <button
            onClick={() => onCancel(item)}
            disabled={cancelling}
            className="h-8 w-8 rounded-lg bg-surface flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
            title="Отменить"
          >
            <RotateCcw size={14} color="#EF4444" />
          </button>
        )}
      </div>
    </div>
  )
}
