export interface Product {
  id: string
  name: string
  image_url: string | null
  current_stock: number
  created_at: string
}

export interface Purchase {
  id: string
  product_id: string
  quantity: number
  price_per_unit: number
  total: number
  contact_id: string | null
  is_paid: boolean
  paid_at: string | null
  status: 'active' | 'returned'
  returned_at: string | null
  created_at: string
}

export interface Sale {
  id: string
  product_id: string
  quantity: number
  price_per_unit: number
  total: number
  contact_id: string | null
  is_paid: boolean
  paid_at: string | null
  status: 'active' | 'returned'
  returned_at: string | null
  created_at: string
}

export type ContactKind = 'customer' | 'supplier' | 'both'

export interface Contact {
  id: string
  name: string
  kind: ContactKind
  phone: string | null
  note: string | null
  created_at: string
}

/** 'receivable' — нам должен покупатель; 'payable' — мы должны поставщику. */
export type DebtDirection = 'receivable' | 'payable'

export interface Debt {
  id: string
  direction: DebtDirection
  contact_id: string | null
  contact_name: string | null
  amount: number
  created_at: string
}

export type Tab = 'dashboard' | 'products' | 'purchase' | 'sale' | 'debts' | 'history'

export interface DashboardStats {
  totalStock: number
  totalInvested: number
  totalRevenue: number
  /** Себестоимость проданного товара (COGS) по средней закупочной цене. */
  totalCOGS: number
  /** Реальная прибыль = выручка − себестоимость проданного. */
  totalProfit: number
  /** Маржа в процентах от выручки (0, если продаж не было). */
  margin: number
}

export interface RevenueDay {
  label: string
  value: number
}

export interface TopProduct {
  name: string
  total: number
}

export interface LowStockItem {
  id: string
  name: string
  current_stock: number
}

export interface Analytics {
  revByDay: RevenueDay[]
  topProducts: TopProduct[]
  lowStock: LowStockItem[]
}

export interface HistoryItem {
  id: string
  type: 'purchase' | 'sale'
  product_id: string
  product_name: string
  quantity: number
  price_per_unit: number
  total: number
  status: 'active' | 'returned'
  created_at: string
}
