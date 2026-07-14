import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Package } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { useSales } from '../../hooks/useSales'
import { useContacts } from '../../hooks/useContacts'
import { formatMoney } from '../../lib/utils'
import PageHeader from '../layout/PageHeader'
import type { Product, Tab } from '../../types'

interface SaleFormProps {
  onSuccess: (message: string) => void
  onNavigate: (tab: Tab) => void
}

export default function SaleForm({ onSuccess, onNavigate }: SaleFormProps) {
  const { products, refetch } = useProducts()
  const { addSale, loading: saving } = useSales()
  const { contacts, findOrCreate } = useContacts()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState('')
  const [pricePerUnit, setPricePerUnit] = useState('')
  const [contactName, setContactName] = useState('')
  const [isDebt, setIsDebt] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    refetch()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const qty = parseInt(quantity) || 0
  const price = parseInt(pricePerUnit) || 0
  const total = qty * price

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || qty <= 0 || price <= 0) return
    const contactId = contactName.trim()
      ? await findOrCreate(contactName.trim(), 'customer')
      : null
    const err = await addSale(
      selectedProduct.id, qty, price, selectedProduct.current_stock, contactId, !isDebt
    )
    if (err) {
      onSuccess('Ошибка: ' + err)
    } else {
      onSuccess(isDebt ? 'Продажа в долг записана ✓' : 'Продажа записана ✓')
      setSelectedProduct(null)
      setQuantity('')
      setPricePerUnit('')
      setContactName('')
      setIsDebt(false)
      setSearch('')
      refetch()
    }
  }

  return (
    <div className="px-4 pb-[90px]">
      <PageHeader title="Новая продажа" />

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 text-center">
          <div className="text-sm text-[#737373] mb-4">Сначала добавьте товар</div>
          <button
            onClick={() => onNavigate('products')}
            className="h-12 bg-accent text-black font-medium rounded-xl text-sm px-6 active:scale-95 transition-transform"
          >
            Перейти к товарам
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative" ref={dropdownRef}>
            <label className="text-xs text-[#737373] mb-1.5 block">Выбор товара</label>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full h-12 bg-card border border-[#1E1E1E] rounded-xl px-4 flex items-center justify-between text-sm text-white active:scale-95 transition-transform"
            >
              {selectedProduct ? (
                <div className="flex items-center gap-2">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <Package size={20} color="#737373" />
                  )}
                  <span>{selectedProduct.name} ({selectedProduct.current_stock} шт)</span>
                </div>
              ) : (
                <span className="text-[#737373]">Выберите товар</span>
              )}
              <ChevronDown size={18} color="#737373" />
            </button>
            {showDropdown && (
              <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-card border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-xl">
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Поиск..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full h-10 bg-[#1A1A1A] border border-[#1E1E1E] rounded-lg px-3 text-sm text-white outline-none mb-1"
                  />
                </div>
                {filtered.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(p)
                      setShowDropdown(false)
                      setSearch('')
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-[#1A1A1A] active:bg-[#1A1A1A]"
                  >
                    {p.image_url ? (
                      <img src={p.image_url} className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-[#1A1A1A] flex items-center justify-center">
                        <Package size={16} color="#737373" />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <div>{p.name}</div>
                      <div className="text-xs text-[#737373]">Остаток: {p.current_stock} шт</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-[#737373] mb-1.5 block">Количество</label>
            <input
              type="number"
              inputMode="numeric"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full h-12 bg-card border border-[#1E1E1E] rounded-xl px-4 text-sm text-white outline-none focus:border-white/20 transition-colors"
              min="1"
            />
            {selectedProduct && qty > selectedProduct.current_stock && (
              <span className="text-xs text-danger mt-1 block">Недостаточно товара на складе (доступно: {selectedProduct.current_stock} шт)</span>
            )}
          </div>

          <div>
            <label className="text-xs text-[#737373] mb-1.5 block">Цена продажи за единицу, ₽</label>
            <input
              type="number"
              inputMode="numeric"
              value={pricePerUnit}
              onChange={e => setPricePerUnit(e.target.value)}
              className="w-full h-12 bg-card border border-[#1E1E1E] rounded-xl px-4 text-sm text-white outline-none focus:border-white/20 transition-colors"
              min="1"
            />
          </div>

          <div>
            <label className="text-xs text-[#737373] mb-1.5 block">Покупатель (необязательно)</label>
            <input
              list="sale-contacts-list"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="Имя контрагента"
              className="w-full h-12 bg-card border border-[#1E1E1E] rounded-xl px-4 text-sm text-white outline-none focus:border-white/20 transition-colors"
            />
            <datalist id="sale-contacts-list">
              {contacts.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>

          <label className="flex items-center justify-between h-12 px-4 bg-card border border-[#1E1E1E] rounded-xl">
            <span className="text-sm text-white">В долг (не оплачено)</span>
            <input
              type="checkbox"
              checked={isDebt}
              onChange={e => setIsDebt(e.target.checked)}
              className="w-5 h-5 accent-[#EF4444]"
            />
          </label>

          <div className="text-center py-2">
            <span className="text-xl font-bold text-success">
              {formatMoney(total)}
            </span>
          </div>

          <button
            type="submit"
            disabled={saving || !selectedProduct || qty <= 0 || price <= 0 || (selectedProduct && qty > selectedProduct.current_stock)}
            className="w-full h-12 bg-success text-white font-medium rounded-xl text-sm active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
          >
            {saving ? 'Сохранение...' : 'Записать продажу'}
          </button>
        </form>
      )}
    </div>
  )
}
