-- ============================================================
-- Миграция: возврат/отмена продаж и закупок
-- Запусти этот файл в SQL Editor проекта Supabase ОДИН раз.
-- Безопасна для повторного запуска (IF NOT EXISTS / IF EXISTS).
-- ============================================================

-- Продажи: статус + дата возврата
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned')),
  ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;

-- Закупки: статус + дата возврата
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned')),
  ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;

-- Обновляем представление долгов: исключаем возвращённые операции
CREATE OR REPLACE VIEW debts AS
  SELECT
    s.id,
    'receivable'::text AS direction,
    s.contact_id,
    c.name AS contact_name,
    s.total AS amount,
    s.created_at
  FROM sales s
  LEFT JOIN contacts c ON c.id = s.contact_id
  WHERE s.is_paid = false AND s.status = 'active'
  UNION ALL
  SELECT
    p.id,
    'payable'::text AS direction,
    p.contact_id,
    c.name AS contact_name,
    p.total AS amount,
    p.created_at
  FROM purchases p
  LEFT JOIN contacts c ON c.id = p.contact_id
  WHERE p.is_paid = false AND p.status = 'active';

-- Индексы для быстрой фильтрации по статусу
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
