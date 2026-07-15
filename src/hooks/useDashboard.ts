import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { DashboardStats, HistoryItem, Analytics } from '../types'

const LOW_STOCK_THRESHOLD = 5
const REVENUE_DAYS = 7

const emptyAnalytics: Analytics = { revByDay: [], topProducts: [], lowStock: [] }

// Локальная дата YYYY-MM-DD (без сдвига по UTC).
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStock: 0,
    totalInvested: 0,
    totalRevenue: 0,
    totalCOGS: 0,
    totalProfit: 0,
    margin: 0,
  })
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([])
  const [analytics, setAnalytics] = useState<Analytics>(emptyAnalytics)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)

    const { data: purchases } = await supabase.from('purchases').select('total, created_at, quantity, price_per_unit, product_id, status').neq('status', 'returned')
    const { data: sales } = await supabase.from('sales').select('total, created_at, quantity, price_per_unit, product_id, status').neq('status', 'returned')
    const { data: allProducts } = await supabase.from('products').select('id, name, current_stock')

    const productMap = new Map((allProducts ?? []).map(p => [p.id, p.name]))

    const totalStock = (allProducts ?? []).reduce((sum, p) => sum + p.current_stock, 0)
    const totalInvested = (purchases ?? []).reduce((sum, p) => sum + p.total, 0)
    const totalRevenue = (sales ?? []).reduce((sum, s) => sum + s.total, 0)

    // Средняя закупочная цена по каждому товару → себестоимость проданного (COGS).
    const costAgg = new Map<string, { total: number; qty: number }>()
    ;(purchases ?? []).forEach(p => {
      const cur = costAgg.get(p.product_id) ?? { total: 0, qty: 0 }
      cur.total += p.total
      cur.qty += p.quantity
      costAgg.set(p.product_id, cur)
    })
    const avgCost = (productId: string): number => {
      const agg = costAgg.get(productId)
      return agg && agg.qty > 0 ? agg.total / agg.qty : 0
    }

    const totalCOGS = Math.round(
      (sales ?? []).reduce((sum, s) => sum + s.quantity * avgCost(s.product_id), 0)
    )
    const totalProfit = totalRevenue - totalCOGS
    const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0

    setStats({ totalStock, totalInvested, totalRevenue, totalCOGS, totalProfit, margin })

    // --- Аналитика ---
    // Выручка за последние REVENUE_DAYS дней (включая нулевые дни).
    const revByDayMap = new Map<string, number>()
    ;(sales ?? []).forEach(s => {
      const key = dayKey(new Date(s.created_at))
      revByDayMap.set(key, (revByDayMap.get(key) ?? 0) + s.total)
    })
    const dayLabels = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
    const revByDay = Array.from({ length: REVENUE_DAYS }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (REVENUE_DAYS - 1 - i))
      return { label: dayLabels[d.getDay()], value: revByDayMap.get(dayKey(d)) ?? 0 }
    })

    // Топ-5 товаров по выручке.
    const revByProduct = new Map<string, number>()
    ;(sales ?? []).forEach(s => {
      revByProduct.set(s.product_id, (revByProduct.get(s.product_id) ?? 0) + s.total)
    })
    const topProducts = Array.from(revByProduct.entries())
      .map(([id, total]) => ({ name: productMap.get(id) ?? 'Неизвестный', total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Товары с низким остатком.
    const lowStock = (allProducts ?? [])
      .filter(p => p.current_stock <= LOW_STOCK_THRESHOLD)
      .map(p => ({ id: p.id, name: p.name, current_stock: p.current_stock }))
      .sort((a, b) => a.current_stock - b.current_stock)

    setAnalytics({ revByDay, topProducts, lowStock })

    const purchaseItems: HistoryItem[] = (purchases ?? []).map(p => ({
      id: p.product_id + '-p-' + p.created_at,
      type: 'purchase' as const,
      product_id: p.product_id,
      product_name: productMap.get(p.product_id) ?? 'Неизвестный',
      quantity: p.quantity,
      price_per_unit: p.price_per_unit,
      total: p.total,
      status: 'active' as const,
      created_at: p.created_at,
    }))

    const saleItems: HistoryItem[] = (sales ?? []).map(s => ({
      id: s.product_id + '-s-' + s.created_at,
      type: 'sale' as const,
      product_id: s.product_id,
      product_name: productMap.get(s.product_id) ?? 'Неизвестный',
      quantity: s.quantity,
      price_per_unit: s.price_per_unit,
      total: s.total,
      status: 'active' as const,
      created_at: s.created_at,
    }))

    const combined = [...purchaseItems, ...saleItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    setRecentHistory(combined)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return { stats, recentHistory, analytics, loading, refetch: fetchDashboard }
}
