import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useDebts } from '../../hooks/useDebts'
import PageHeader from '../layout/PageHeader'
import { formatMoney, formatDateRu } from '../../lib/utils'
import type { Debt } from '../../types'

const RECEIVABLE = '#22C55E'
const PAYABLE = '#EF4444'

export default function DebtsList() {
  const { debts, loading, markPaid } = useDebts()
  const [payingId, setPayingId] = useState<string | null>(null)

  const receivable = debts.filter(d => d.direction === 'receivable')
  const payable = debts.filter(d => d.direction === 'payable')
  const sum = (arr: Debt[]) => arr.reduce((s, d) => s + d.amount, 0)

  const handlePaid = async (d: Debt) => {
    setPayingId(d.id)
    await markPaid(d)
    setPayingId(null)
  }

  const renderGroup = (title: string, arr: Debt[], color: string, sign: string) => (
    <div className="mb-6">
      <h2 className="text-base font-medium text-white mb-3">{title}</h2>
      {arr.length === 0 ? (
        <div className="bg-card border border-white/10 rounded-[20px] p-4 text-center text-sm text-[#737373]">
          Долгов нет
        </div>
      ) : (
        <div className="bg-card border border-white/10 rounded-[20px] overflow-hidden">
          {arr.map(d => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="text-sm text-white truncate">
                  {d.contact_name ?? 'Без контрагента'}
                </div>
                <div className="text-xs text-[#737373]">{formatDateRu(d.created_at)}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-medium" style={{ color }}>
                  {sign}{formatMoney(d.amount)}
                </span>
                <button
                  onClick={() => handlePaid(d)}
                  disabled={payingId === d.id}
                  className="h-9 px-3 rounded-lg bg-surface text-xs text-white active:scale-[0.98] transition-transform duration-150 disabled:opacity-40"
                >
                  {payingId === d.id ? '...' : 'Оплачено'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="px-4 pb-[90px]">
      <PageHeader title="Долги" />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-card border border-white/10 rounded-[20px] p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-card border border-white/10 rounded-[20px] p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#737373]">Нам должны</span>
                <TrendingUp size={20} color={RECEIVABLE} />
              </div>
              <span className="text-xl font-semibold" style={{ color: RECEIVABLE }}>
                {formatMoney(sum(receivable))}
              </span>
            </div>
            <div className="bg-card border border-white/10 rounded-[20px] p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#737373]">Мы должны</span>
                <TrendingDown size={20} color={PAYABLE} />
              </div>
              <span className="text-xl font-semibold" style={{ color: PAYABLE }}>
                {formatMoney(sum(payable))}
              </span>
            </div>
          </div>

          {renderGroup('Нам должны', receivable, RECEIVABLE, '+')}
          {renderGroup('Мы должны', payable, PAYABLE, '-')}
        </>
      )}
    </div>
  )
}
