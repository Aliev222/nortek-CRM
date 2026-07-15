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

  const returnSale = async (
    saleId: string,
    product_id: string,
    quantity: number,
  ): Promise<string | null> => {
    setLoading(true)

    const { error: returnError } = await supabase
      .from('sales')
      .update({ status: 'returned', returned_at: new Date().toISOString() })
      .eq('id', saleId)
    if (returnError) {
      setLoading(false)
      return returnError.message
    }

    const { data: product } = await supabase
      .from('products')
      .select('current_stock')
      .eq('id', product_id)
      .single()
    if (!product) {
      setLoading(false)
      return 'Товар не найден'
    }

    const { error: updateError } = await supabase
      .from('products')
      .update({ current_stock: product.current_stock + quantity })
      .eq('id', product_id)
    if (updateError) {
      setLoading(false)
      return updateError.message
    }

    setLoading(false)
    return null
  }

  return { addSale, returnSale, loading }
}
