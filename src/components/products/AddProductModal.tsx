import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import Sheet from '../ui/Sheet'
import type { Product } from '../../types'

export interface ProductFormValues {
  name: string
  image_url: string | null
  current_stock: number
}

interface AddProductModalProps {
  /** When provided, the sheet opens in edit mode with prefilled values. */
  product?: Product | null
  onClose: () => void
  onSubmit: (values: ProductFormValues) => Promise<string | null>
}

export default function AddProductModal({ product, onClose, onSubmit }: AddProductModalProps) {
  const isEdit = !!product
  const [name, setName] = useState(product?.name ?? '')
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
  const [stock, setStock] = useState(String(product?.current_stock ?? 0))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewOk, setPreviewOk] = useState(true)

  const canSave = name.trim().length > 0 && !saving

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const err = await onSubmit({
      name: name.trim(),
      image_url: imageUrl.trim() || null,
      current_stock: Math.max(0, parseInt(stock) || 0),
    })
    setSaving(false)
    if (err) setError(err)
    else onClose()
  }

  const trimmedUrl = imageUrl.trim()

  return (
    <Sheet open onClose={onClose} title={isEdit ? 'Редактировать товар' : 'Новый товар'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-surface flex items-center justify-center">
            {trimmedUrl && previewOk ? (
              <img
                src={trimmedUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setPreviewOk(false)}
                onLoad={() => setPreviewOk(true)}
              />
            ) : (
              <ImageOff size={22} color="#737373" />
            )}
          </div>
          <div className="flex-1">
            <label className="text-xs text-text-secondary mb-1.5 block">Название товара</label>
            <input
              type="text"
              placeholder="Например, Кроссовки Nike"
              value={name}
              onChange={e => setName(e.target.value)}
              enterKeyHint="done"
              className="w-full h-12 bg-surface border border-hairline rounded-xl px-4 text-sm text-white outline-none focus:border-white/25 transition-[border-color] duration-150"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-text-secondary mb-1.5 block">Ссылка на фото (необязательно)</label>
          <input
            type="url"
            placeholder="https://…"
            value={imageUrl}
            onChange={e => { setImageUrl(e.target.value); setPreviewOk(true) }}
            className="w-full h-12 bg-surface border border-hairline rounded-xl px-4 text-sm text-white outline-none focus:border-white/25 transition-[border-color] duration-150"
          />
        </div>

        {isEdit && (
          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">Остаток на складе, шт</label>
            <input
              type="number"
              inputMode="numeric"
              value={stock}
              onChange={e => setStock(e.target.value)}
              min="0"
              className="w-full h-12 bg-surface border border-hairline rounded-xl px-4 text-sm text-white outline-none focus:border-white/25 transition-[border-color] duration-150"
            />
            <p className="text-[11px] text-text-secondary mt-1.5">
              Ручная корректировка. Обычно остаток меняется через закупки и продажи.
            </p>
          </div>
        )}

        {error && <div className="text-xs text-danger">{error}</div>}

        <button
          type="submit"
          disabled={!canSave}
          className="w-full h-12 bg-accent text-black font-semibold rounded-xl text-sm active:scale-[0.98] transition-transform duration-150 disabled:opacity-40 disabled:active:scale-100"
          style={{ transitionTimingFunction: 'var(--ease-out-soft)' }}
        >
          {saving ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Добавить товар'}
        </button>
      </form>
    </Sheet>
  )
}
