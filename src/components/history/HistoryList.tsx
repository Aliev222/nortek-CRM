import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useSales } from '../../hooks/useSales'
import { usePurchases } from '../../hooks/usePurchases'
import PageHeader from '../layout/PageHeader'
import HistoryItem from './HistoryItem'
import { formatDateRu } from '../../lib/utils'
import type { HistoryItem as HistoryItemType } from '../../types'

const FILTERS = ['Все', 'Закупки', 'Продажи'] as const
type Filter = typeof FILTERS[number]

export default function HistoryList() {
  const [items, setItems] = useState<HistoryItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('Все')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const { returnSale } = useSales()
  const { returnPurchase } = usePurchases()
  const PAGE_SIZE = 20

  const fetchHistory = useCallback(async (pageNum: number, append: boolean = false) => {
    setLoading(true)
    const from = pageNum * PAGE_SIZE

    const { data: allProducts } = await supabase.from('products').select('id, name')
    const productMap = new Map((allProducts ?? []).map(p => [p.id, p.name]))

    let purchases: any[] = []
    let sales: any[] = []

    if (filter !== 'Продажи') {
      const { data } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, 1000)
      purchases = data ?? []
    }
    if (filter !== 'Закупки') {
      const { data } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .range(0, 1000)
      sales = data ?? []
    }

    const purchaseItems: HistoryItemType[] = purchases.map(p => ({
      id: p.id,
      type: 'purchase' as const,
      product_id: p.product_id,
      product_name: productMap.get(p.product_id) ?? 'Неизвестный',
      quantity: p.quantity,
      price_per_unit: p.price_per_unit,
      total: p.total,
      status: p.status ?? 'active',
      created_at: p.created_at,
    }))

    const saleItems: HistoryItemType[] = sales.map(s => ({
      id: s.id,
      type: 'sale' as const,
      product_id: s.product_id,
      product_name: productMap.get(s.product_id) ?? 'Неизвестный',
      quantity: s.quantity,
      price_per_unit: s.price_per_unit,
      total: s.total,
      status: s.status ?? 'active',
      created_at: s.created_at,
    }))

    const combined = [...purchaseItems, ...saleItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const pageItems = combined.slice(from, from + PAGE_SIZE)
    setHasMore(from + PAGE_SIZE < combined.length)

    if (append) {
      setItems(prev => [...prev, ...pageItems])
    } else {
      setItems(pageItems)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => {
    setPage(0)
    fetchHistory(0)
  }, [fetchHistory])

  const handleCancel = async (item: HistoryItemType) => {
    if (item.status === 'returned') return
    if (!window.confirm(
      item.type === 'sale'
        ? `Отменить продажу "${item.product_name}"? Товар (×${item.quantity}) вернётся на склад.`
        : `Отменить закупку "${item.product_name}"? Товар (×${item.quantity}) будет списан со склада.`
    )) return

    setCancellingId(item.id)
    const err = item.type === 'sale'
      ? await returnSale(item.id, item.product_id, item.quantity)
      : await returnPurchase(item.id, item.product_id, item.quantity)
    setCancellingId(null)

    if (err) {
      alert('Ошибка: ' + err)
    } else {
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: 'returned' as const } : i
      ))
    }
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchHistory(nextPage, true)
  }

  const grouped: Record<string, HistoryItemType[]> = {}
  items.forEach(item => {
    const dateKey = formatDateRu(item.created_at)
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(item)
  })

  return (
    <div className="px-4 pb-[90px]">
      <PageHeader title="История операций" />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium active:scale-95 transition-transform ${
              filter === f
                ? 'bg-accent text-black'
                : 'bg-card border border-white/10 text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([date, dateItems]) => (
        <div key={date} className="mb-4">
          <div className="text-xs text-[#737373] font-medium mb-2 px-1">{date}</div>
          <div className="bg-card border border-white/10 rounded-[20px] overflow-hidden">
            {dateItems.map((item, i) => (
              <div key={item.id + i} className="border-b border-white/10 last:border-b-0">
                <HistoryItem
                  item={item}
                  onCancel={handleCancel}
                  cancelling={cancellingId === item.id}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {!loading && items.length === 0 && (
        <div className="text-center text-sm text-[#737373] mt-10">Операций пока нет</div>
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-white/10 rounded-[20px] p-4 h-16 animate-pulse" />
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <button
          onClick={loadMore}
          className="w-full h-12 bg-card border border-white/10 text-white font-medium rounded-xl text-sm mt-4 active:scale-95 transition-transform"
        >
          Загрузить ещё
        </button>
      )}
    </div>
  )
}
