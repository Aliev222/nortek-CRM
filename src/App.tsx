import { useState, useCallback, useEffect } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import BottomNav from './components/layout/BottomNav'
import Dashboard from './components/dashboard/Dashboard'
import ProductList from './components/products/ProductList'
import PurchaseForm from './components/operations/PurchaseForm'
import SaleForm from './components/operations/SaleForm'
import DebtsList from './components/debts/DebtsList'
import HistoryList from './components/history/HistoryList'
import type { Tab } from './types'

interface ToastState {
  message: string
  variant: 'success' | 'error'
}

function Toast({ toast, onHide }: { toast: ToastState; onHide: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onHide, 2400)
    return () => clearTimeout(timer)
  }, [toast, onHide])

  const isError = toast.variant === 'error'

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 rounded-2xl bg-card/90 backdrop-blur-md border text-sm text-white font-medium shadow-xl animate-page-in"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)', borderColor: isError ? 'rgba(239,68,68,0.5)' : 'rgba(34,197,94,0.5)' }}
      role="status"
    >
      {isError
        ? <AlertCircle size={18} color="#EF4444" />
        : <CheckCircle2 size={18} color="#22C55E" />}
      {toast.message}
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [toast, setToast] = useState<ToastState | null>(null)

  const showToast = useCallback((message: string) => {
    const isError = message.toLowerCase().startsWith('ошибка')
    setToast({ message, variant: isError ? 'error' : 'success' })
  }, [])

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab)
  }, [])

  return (
    <div className="max-w-md mx-auto min-h-screen bg-bg">
      {/* key forces the page-in animation to replay on every tab switch */}
      <div key={activeTab}>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'products' && <ProductList />}
        {activeTab === 'purchase' && (
          <PurchaseForm onSuccess={showToast} onNavigate={handleTabChange} />
        )}
        {activeTab === 'sale' && (
          <SaleForm onSuccess={showToast} onNavigate={handleTabChange} />
        )}
        {activeTab === 'debts' && <DebtsList />}
        {activeTab === 'history' && <HistoryList />}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {toast && <Toast toast={toast} onHide={() => setToast(null)} />}
    </div>
  )
}

export default App
