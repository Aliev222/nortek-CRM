import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useSales() {
  const [loading, setLoading] = useState(false)

  const addSale = async (
    product_id: string,
    quantity: number,
    price_per_unit: number,
    currentStock: number,
    contactId: string | null = null,
    isPaid: boolean = true
  ): Promise<string | null> => {
    if (quantity > currentStock) {
      return 'Недостаточно товара на складе'
    }

    setLoading(true)
    const total = quantity * price_per_unit

    const { error: saleError } = await supabase
      .from('sales')
      .insert({
        product_id,
        quantity,
        price_per_unit,
        total,
        contact_id: contactId,
        is_paid: isPaid,
        paid_at: isPaid ? new Date().toISOString() : null,
      })
    if (saleError) {
      setLoading(false)
      return saleError.message
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ current_stock: currentStock - quantity })
      .eq('id', product_id)
    if (updateError) {
      setLoading(false)
      return updateError.message
    }

    setLoading(false)
    return null
  }

  return { addSale, loading }
}
