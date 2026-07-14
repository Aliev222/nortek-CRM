import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Debt } from '../types'

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDebts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false })
    setDebts((data ?? []) as Debt[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDebts()
  }, [fetchDebts])

  // Вью `debts` — только для чтения; направление решает, какую исходную
  // таблицу пометить оплаченной.
  const markPaid = async (debt: Debt): Promise<string | null> => {
    const table = debt.direction === 'receivable' ? 'sales' : 'purchases'
    const { error } = await supabase
      .from(table)
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('id', debt.id)
    if (error) return error.message
    await fetchDebts()
    return null
  }

  return { debts, loading, markPaid, refetch: fetchDebts }
}
