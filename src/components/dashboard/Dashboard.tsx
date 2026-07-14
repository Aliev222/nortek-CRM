import { AlertTriangle, Package, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useDashboard } from '../../hooks/useDashboard'
import StatCard from './StatCard'
import BarChart from '../analytics/BarChart'
import PageHeader from '../layout/PageHeader'
import { formatMoney } from '../../lib/utils'

export default function Dashboard() {
  const { stats, recentHistory, analytics, loading } = useDashboard()

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const topMax = analytics.topProducts.reduce((m, p) => Math.max(m, p.total), 0)

  return (
    <div className="px-4 pb-[90px]">
      <PageHeader title="Nortek CRM" />

      {loading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-white/10 rounded-[20px] p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            title="Товаров на складе"
            value={String(stats.totalStock)}
            icon={Package}
            color="#3B82F6"
          />
          <StatCard
            title="Вложено"
            value={formatMoney(stats.totalInvested)}
            icon={TrendingDown}
            color="#EF4444"
          />
          <StatCard
            title="Выручка"
            value={formatMoney(stats.totalRevenue)}
            icon={TrendingUp}
            color="#22C55E"
          />
          <StatCard
            title={stats.totalRevenue > 0 ? `Прибыль · ${stats.margin}%` : 'Прибыль'}
            value={formatMoney(stats.totalProfit)}
            icon={Wallet}
            color={stats.totalProfit >= 0 ? '#22C55E' : '#EF4444'}
          />
        </div>
      )}

      {!loading && analytics.lowStock.length > 0 && (
        <div className="bg-card border border-white/10 rounded-[20px] p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} color="#EF4444" />
            <h2 className="text-base font-medium text-white">Пора докупить</h2>
            <span className="ml-auto text-xs font-medium text-white bg-danger rounded-full px-2 py-0.5">
              {analytics.lowStock.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {analytics.lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-white truncate">{p.name}</span>
                <span className="text-[#737373] shrink-0 ml-3">{p.current_stock} шт</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <>
          <h2 className="text-base font-medium text-white mb-3">Выручка за 7 дней</h2>
          <div className="bg-card border border-white/10 rounded-[20px] p-4 mb-6">
            <BarChart data={analytics.revByDay} color="#22C55E" />
          </div>

          {analytics.topProducts.length > 0 && (
            <>
              <h2 className="text-base font-medium text-white mb-3">Топ товаров</h2>
              <div className="bg-card border border-white/10 rounded-[20px] p-4 mb-6 flex flex-col gap-3">
                {analytics.topProducts.map((p, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white truncate">{p.name}</span>
                      <span className="text-[#737373] shrink-0 ml-3">{formatMoney(p.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${topMax > 0 ? (p.total / topMax) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <h2 className="text-base font-medium text-white mb-3">Последние операции</h2>

      {recentHistory.length === 0 ? (
        <div className="bg-card border border-white/10 rounded-[20px] p-4 text-center text-sm text-[#737373]">
          Операций пока нет
        </div>
      ) : (
        <div className="bg-card border border-white/10 rounded-[20px] overflow-hidden">
          {recentHistory.map((item, i) => (
            <div
              key={item.id + i}
              className="flex items-center justify-between px-4 py-3 border-b border-white/10 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                {item.type === 'sale' ? (
                  <TrendingUp size={20} color="#22C55E" />
                ) : (
                  <TrendingDown size={20} color="#EF4444" />
                )}
                <span className="text-sm text-white">{item.product_name}</span>
              </div>
              <div className="text-right">
                <span
                  className="text-sm font-medium"
                  style={{ color: item.type === 'sale' ? '#22C55E' : '#EF4444' }}
                >
                  {item.type === 'sale' ? '+' : '-'}{formatMoney(item.total)}
                </span>
                <div className="text-xs text-[#737373]">{formatDate(item.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
