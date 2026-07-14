-- ============================================================
-- Миграция: контрагенты и долги (продажи/закупки в долг)
-- Запусти этот файл в SQL Editor проекта Supabase ОДИН раз.
-- Безопасна для повторного запуска (IF NOT EXISTS / IF EXISTS).
-- ============================================================

-- Контрагенты: покупатели и поставщики
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'customer' CHECK (kind IN ('customer', 'supplier', 'both')),
  phone TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Продажи: кому продали + оплачено ли
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Закупки: у кого купили + оплачено ли (долг поставщику)
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Индексы для выборки долгов
CREATE INDEX IF NOT EXISTS idx_sales_contact_id ON sales(contact_id);
CREATE INDEX IF NOT EXISTS idx_sales_is_paid ON sales(is_paid);
CREATE INDEX IF NOT EXISTS idx_purchases_contact_id ON purchases(contact_id);
CREATE INDEX IF NOT EXISTS idx_purchases_is_paid ON purchases(is_paid);

-- RLS (в проекте политика открыта для всех — сохраняем единообразие)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on contacts" ON contacts;
CREATE POLICY "Allow all on contacts" ON contacts FOR ALL USING (true) WITH CHECK (true);

-- Удобное представление: непогашенные долги (нам должны + мы должны)
CREATE OR REPLACE VIEW debts AS
  SELECT
    s.id,
    'receivable'::text AS direction,   -- нам должен покупатель
    s.contact_id,
    c.name AS contact_name,
    s.total AS amount,
    s.created_at
  FROM sales s
  LEFT JOIN contacts c ON c.id = s.contact_id
  WHERE s.is_paid = false
  UNION ALL
  SELECT
    p.id,
    'payable'::text AS direction,      -- мы должны поставщику
    p.contact_id,
    c.name AS contact_name,
    p.total AS amount,
    p.created_at
  FROM purchases p
  LEFT JOIN contacts c ON c.id = p.contact_id
  WHERE p.is_paid = false;
