import { LayoutDashboard, Package, ShoppingCart, DollarSign, HandCoins, Clock } from 'lucide-react'
import type { Tab } from '../../types'

interface BottomNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
  { id: 'products', label: 'Товары', icon: Package },
  { id: 'purchase', label: 'Закупка', icon: ShoppingCart },
  { id: 'sale', label: 'Продажа', icon: DollarSign },
  { id: 'debts', label: 'Долги', icon: HandCoins },
  { id: 'history', label: 'История', icon: Clock },
]

const ACTIVE = '#22C55E'
const INACTIVE = '#525252'

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-card/95 backdrop-blur-md border-t border-white/10"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
    >
      <div className="flex items-stretch justify-around h-14">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center flex-1 min-w-[44px] gap-0.5 active:scale-90 transition-transform duration-150"
            >
              {/* active indicator bar */}
              <span
                className="absolute top-0 h-0.5 w-8 rounded-full transition-opacity duration-200"
                style={{ backgroundColor: ACTIVE, opacity: isActive ? 1 : 0 }}
              />
              <Icon
                size={23}
                color={isActive ? ACTIVE : INACTIVE}
                className="transition-colors duration-200"
              />
              <span
                className="text-[10px] leading-none transition-colors duration-200"
                style={{ color: isActive ? ACTIVE : INACTIVE }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
