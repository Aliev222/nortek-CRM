import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { supabase } from '../../lib/supabase'
import ProductCard from './ProductCard'
import AddProductModal, { type ProductFormValues } from './AddProductModal'
import Sheet from '../ui/Sheet'
import PageHeader from '../layout/PageHeader'
import type { Product } from '../../types'

export default function ProductList() {
  const { products, loading, addProduct, deleteProduct, updateProduct } = useProducts()
  const [showAdd, setShowAdd] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [avgPrices, setAvgPrices] = useState<Record<string, number>>({})
  const [menuProduct, setMenuProduct] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAvgPrices = async () => {
    const { data: purchases } = await supabase
      .from('purchases')
      .select('product_id, total, quantity')
    if (!purchases) return
    const map: Record<string, { total: number; qty: number }> = {}
    purchases.forEach(p => {
      if (!map[p.product_id]) map[p.product_id] = { total: 0, qty: 0 }
      map[p.product_id].total += p.total
      map[p.product_id].qty += p.quantity
    })
    const prices: Record<string, number> = {}
    Object.entries(map).forEach(([id, v]) => {
      prices[id] = Math.round(v.total / v.qty)
    })
    setAvgPrices(prices)
  }

  useEffect(() => { fetchAvgPrices() }, [])

  const handleAdd = (v: ProductFormValues) => addProduct(v.name, v.image_url)

  const handleEdit = (v: ProductFormValues) => {
    if (!editProduct) return Promise.resolve('Нет товара')
    return updateProduct(editProduct.id, v)
  }

  const handleDelete = async () => {
    if (!menuProduct) return
    setDeleting(true)
    await deleteProduct(menuProduct.id)
    setDeleting(false)
    setMenuProduct(null)
  }

  return (
    <div className="px-4 pb-[90px] animate-page-in">
      <PageHeader
        title="Товары"
        rightElement={
          <button
            onClick={() => setShowAdd(true)}
            aria-label="Добавить товар"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full active:scale-90 transition-transform duration-150"
          >
            <Plus size={24} color="#22C55E" />
          </button>
        }
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-white/10 rounded-[20px] p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 text-center">
          <div className="text-sm text-text-secondary mb-4">Товаров пока нет</div>
          <button
            onClick={() => setShowAdd(true)}
            className="h-12 bg-accent text-black font-semibold rounded-xl text-sm px-6 active:scale-[0.98] transition-transform duration-150"
          >
            Добавить первый товар
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              avgPurchasePrice={avgPrices[product.id] ?? 0}
              onEdit={p => setMenuProduct(p)}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddProductModal onClose={() => setShowAdd(false)} onSubmit={handleAdd} />
      )}

      {editProduct && (
        <AddProductModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSubmit={handleEdit}
        />
      )}

      <Sheet open={!!menuProduct} onClose={() => setMenuProduct(null)} title={menuProduct?.name}>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              const p = menuProduct
              setMenuProduct(null)
              setEditProduct(p)
            }}
            className="w-full h-12 flex items-center justify-center gap-2 bg-surface text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-transform duration-150"
          >
            <Pencil size={18} />
            Редактировать
          </button>
          <button
            onClick={() => {
              if (window.confirm('Удалить товар? Все закупки и продажи этого товара тоже удалятся.')) {
                handleDelete()
              }
            }}
            disabled={deleting}
            className="w-full h-12 flex items-center justify-center gap-2 bg-danger text-white font-semibold rounded-xl text-sm active:scale-[0.98] transition-transform duration-150 disabled:opacity-50"
          >
            <Trash2 size={18} />
            {deleting ? 'Удаление…' : 'Удалить товар'}
          </button>
          <button
            onClick={() => setMenuProduct(null)}
            className="w-full h-12 bg-transparent text-text-secondary font-medium rounded-xl text-sm active:scale-[0.98] transition-transform duration-150"
          >
            Отмена
          </button>
        </div>
      </Sheet>
    </div>
  )
}
