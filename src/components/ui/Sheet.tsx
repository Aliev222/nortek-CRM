import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

/**
 * Keyboard-safe bottom sheet.
 *
 * Anchored to the bottom of the visual viewport. Combined with
 * `interactive-widget=resizes-content` in index.html, the on-screen keyboard
 * shrinks the layout viewport instead of covering this sheet — so the primary
 * action button stays visible while typing. Content scrolls internally when it
 * exceeds the available height; the action row is part of that flow, never
 * pinned off-screen.
 */
export default function Sheet({ open, onClose, title, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape, lock background scroll, autofocus first field.
  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const firstField = panelRef.current?.querySelector<HTMLElement>(
      'input, textarea, select'
    )
    // Delay so the slide-in animation isn't interrupted by keyboard focus.
    const t = window.setTimeout(() => firstField?.focus(), 250)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      window.clearTimeout(t)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        onMouseDown={e => e.stopPropagation()}
        className="animate-sheet-in w-full max-w-md bg-card border-t border-white/10 rounded-t-[24px] flex flex-col"
        style={{ maxHeight: '90dvh' }}
      >
        {/* Grabber */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-white/15" />
        </div>

        {title && (
          <div className="px-5 pt-2 pb-1 shrink-0">
            <h2 className="text-lg font-semibold text-white text-balance">{title}</h2>
          </div>
        )}

        <div
          className="px-5 pt-3 overflow-y-auto"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
