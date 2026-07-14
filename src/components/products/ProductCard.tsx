import { ImageOff, MoreVertical } from 'lucide-react'
import type { Product } from '../../types'

interface ProductCardProps {
  product: Product
  avgPurchasePrice: number
  onEdit: (product: Product) => void
}

export default function ProductCard({ product, avgPurchasePrice, onEdit }: ProductCardProps) {
  return (
    <div className="bg-card border border-white/10 rounded-[20px] p-4 flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#1A1A1A] flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none'
              ;(e.target as HTMLImageElement).parentElement!.innerHTML = ''
              const icon = document.createElement('div')
              icon.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737373" stroke-width="2"><path d="M2 12L9 19L22 6"/></svg>'
              ;(e.target as HTMLImageElement).parentElement!.appendChild(icon)
            }}
          />
        ) : (
          <ImageOff size={20} color="#737373" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white font-medium truncate">{product.name}</div>
        <div className="text-xs text-[#737373]">На складе: {product.current_stock} шт</div>
        {avgPurchasePrice > 0 && (
          <div className="text-xs text-[#737373]">Ср. закупка: ₽{avgPurchasePrice}</div>
        )}
      </div>
      <button
        onClick={() => onEdit(product)}
        className="min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 transition-transform"
      >
        <MoreVertical size={20} color="#737373" />
      </button>
    </div>
  )
}
