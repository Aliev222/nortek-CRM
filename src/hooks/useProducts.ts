import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Product } from '../types'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setProducts(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const addProduct = async (name: string, image_url: string | null) => {
    const { error } = await supabase
      .from('products')
      .insert({ name, image_url })
    if (error) return error.message
    await fetchProducts()
    return null
  }

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    if (error) return error.message
    await fetchProducts()
    return null
  }

  const updateStock = async (id: string, newStock: number) => {
    const { error } = await supabase
      .from('products')
      .update({ current_stock: newStock })
      .eq('id', id)
    if (error) return error.message
    await fetchProducts()
    return null
  }

  const updateProduct = async (
    id: string,
    fields: { name: string; image_url: string | null; current_stock: number }
  ) => {
    const { error } = await supabase
      .from('products')
      .update(fields)
      .eq('id', id)
    if (error) return error.message
    await fetchProducts()
    return null
  }

  return { products, loading, error, addProduct, deleteProduct, updateStock, updateProduct, refetch: fetchProducts }
}
