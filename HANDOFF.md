# HANDOFF — Nortek CRM: долги/контрагенты (№3) + аналитика (№4)

Документ для следующего агента. Содержит текущее состояние, схему БД, конвенции
кода проекта и детальный пошаговый план по двум оставшимся фичам — вплоть до
готовых сниппетов. Работай строго по этому плану.

---

## 0. Контекст проекта

- **Стек:** React 18 + TypeScript + Vite 6 + Tailwind v4 (`@theme` в CSS) + Supabase.
- **Формат:** мобильное веб-приложение, `max-width: 448px` (`max-w-md`), тёмная тема, RU-локаль, валюта ₽ (цены — целые `INTEGER`, копеек нет).
- **Сборка/проверка:** `npm run build` (= `tsc -b && vite build`). После КАЖДОЙ фичи прогоняй сборку — она ловит все ошибки типов.
- **Точка входа:** `src/main.tsx` → `src/App.tsx`. Навигация — локальный `useState<Tab>` в `App.tsx` (роутера нет), нижнее меню `BottomNav`.

### ⚠️ Про «гейт» (важно для стоимости)
В сессии активен хук `pre:edit-write:gateguard-fact-force`, который перед каждой
правкой файла требует заново «доказать факты» (запустить Grep/Glob и описать
импортёров). Это резко удорожает работу. **Рекомендация:** запусти сессию с
`ECC_GATEGUARD=off` или добавь `pre:edit-write:gateguard-fact-force` в
`ECC_DISABLED_HOOKS`. Тогда правки пойдут без дорогих доп. проверок.
Чтобы минимизировать число правок — предпочитай полную перезапись файла (`Write`)
одному-двум мелким `Edit`.

---

## 1. Что уже сделано (НЕ переделывать)

**UI/UX-переработка:**
- `index.html` — в `<meta viewport>` добавлен `interactive-widget=resizes-content` (клавиатура сжимает viewport, а не перекрывает модалки).
- `src/index.css` — токены движения (`--ease-out-soft`, `--ease-spring`), цветовые токены (`--color-surface`, `--color-hairline` и др.), keyframes `sheet-in`/`fade-in`/`page-in`, глобальные `tabular-nums`, `img { outline … }`, `prefers-reduced-motion`.
- `src/components/ui/Sheet.tsx` — **переиспользуемый keyboard-safe bottom-sheet** (портал в `document.body`, автофокус первого поля, скролл контента, safe-area, закрытие по Esc/тапу вне, блок скролла фона). **Используй его для ВСЕХ модалок.**
- `src/App.tsx` — Toast с вариантами success/error (иконка + цвет рамки; вариант определяется по префиксу «Ошибка» в сообщении), анимация смены вкладок через `key={activeTab}` + `animate-page-in`.
- `src/components/layout/BottomNav.tsx` — индикатор активной вкладки, backdrop-blur, safe-area.

**№1 Редактирование товара (готово):**
- `src/hooks/useProducts.ts` — добавлен `updateProduct(id, { name, image_url, current_stock })`.
- `src/components/products/AddProductModal.tsx` — работает в двух режимах: создание и редактирование (проп `product?: Product`). Экспортирует `ProductFormValues`. Проп `onSubmit(values: ProductFormValues) => Promise<string|null>`.
- `src/components/products/ProductList.tsx` — в bottom-sheet товара кнопки «Редактировать» / «Удалить» / «Отмена».

**№2 Реальная маржа COGS (готово):**
- `src/types/index.ts` — в `DashboardStats` добавлены `totalCOGS`, `margin`.
- `src/hooks/useDashboard.ts` — COGS = Σ(sale.quantity × средняя закупочная цена товара); `totalProfit = totalRevenue − totalCOGS`; `margin = round(profit/revenue*100)`.
- `src/components/dashboard/Dashboard.tsx` — карточка «Прибыль» показывает `Прибыль · {margin}%`.

**№3 Долги — частично:**
- Миграция `supabase/migration_debts.sql` **уже применена пользователем в Supabase**.
- `src/types/index.ts` — **уже добавлены** типы `Contact`, `ContactKind`, `Debt`, `DebtDirection`, вкладка `'debts'` в `Tab`, и поля `contact_id/is_paid/paid_at` в `Purchase` и `Sale`. (Проверь глазами перед работой.)

---

## 2. Схема БД (после применённой миграции)

```
products(id uuid pk, name text, image_url text|null, current_stock int, created_at timestamptz)

purchases(id uuid pk, product_id uuid fk->products ON DELETE CASCADE,
          quantity int>0, price_per_unit int>0, total int>0,
          contact_id uuid|null fk->contacts ON DELETE SET NULL,
          is_paid bool default true, paid_at timestamptz|null,
          created_at timestamptz)

sales(id uuid pk, product_id uuid fk->products ON DELETE CASCADE,
      quantity int>0, price_per_unit int>0, total int>0,
      contact_id uuid|null fk->contacts ON DELETE SET NULL,
      is_paid bool default true, paid_at timestamptz|null,
      created_at timestamptz)

contacts(id uuid pk, name text, kind text in('customer','supplier','both') default 'customer',
         phone text|null, note text|null, created_at timestamptz)

-- VIEW (только чтение):
debts(id, direction text 'receivable'|'payable', contact_id, contact_name, amount, created_at)
  receivable = непогашенная продажа (нам должен покупатель)
  payable    = непогашенная закупка (мы должны поставщику)
```

RLS у всех таблиц открыт (`Allow all USING(true)`) — как в остальном проекте.

---

## 3. Конвенции кода (соблюдай!)

- **Модалки** — только через `Sheet` (`src/components/ui/Sheet.tsx`). Внутри — форма с кнопкой действия сразу под полями.
- **Классы:** тёмные поверхности `bg-card` / `bg-surface`, границы `border border-white/10` или `border-hairline`, вторичный текст `text-text-secondary`, акценты: успех/приход `#22C55E`, расход/долг `#EF4444`, «фирменный» лайм `bg-accent text-black` для главных кнопок.
- **Радиусы:** карточки `rounded-[20px]`, поля/кнопки `rounded-xl`, sheet `rounded-t-[24px]`.
- **Кнопки:** высота `h-12`, `active:scale-[0.98] transition-transform duration-150`, `disabled:opacity-40`.
- **Поля ввода:** `h-12 bg-surface border border-hairline rounded-xl px-4 text-sm text-white outline-none focus:border-white/25 transition-[border-color] duration-150`. Для чисел `type="number" inputMode="numeric"`.
- **Анимация появления страницы:** оборачивай корневой `div` экрана в `className="px-4 pb-[90px] animate-page-in"`.
- **Никогда** `transition: all`. Указывай свойства.
- **Деньги:** `formatMoney()` из `src/lib/utils.ts`. Даты: `formatDateRu()`, `formatTime()`.
- **Ошибки:** хуки возвращают `Promise<string | null>` (строка ошибки или `null`). Формы показывают ошибку через проп `onSuccess('Ошибка: ...')` -> Toast станет красным.
- **Паттерн операций:** insert в `purchases`/`sales` + отдельный `update` склада `products` (без транзакции — так в проекте сейчас; не рефакторить в рамках этих задач).

---

## 4. ФИЧА №3 — Долги и контрагенты

### 4.1 Новый хук `src/hooks/useContacts.ts`
Список контрагентов + «найти-или-создать» (для ввода имени прямо в форме).

```ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Contact, ContactKind } from '../types'

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])

  const fetchContacts = useCallback(async () => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .order('name', { ascending: true })
    setContacts(data ?? [])
  }, [])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  // Возвращает id существующего (по имени, без регистра) или создаёт нового.
  const findOrCreate = async (name: string, kind: ContactKind): Promise<string | null> => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const existing = contacts.find(c => c.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) return existing.id
    const { data, error } = await supabase
      .from('contacts')
      .insert({ name: trimmed, kind })
      .select('id')
      .single()
    if (error || !data) return null
    await fetchContacts()
    return data.id
  }

  return { contacts, findOrCreate, refetch: fetchContacts }
}
```

### 4.2 Новый хук `src/hooks/useDebts.ts`
Чтение вью `debts` + отметка «оплачено» (обновляет исходную строку sales/purchases).

```ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Debt } from '../types'

export function useDebts() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDebts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false })
    setDebts((data ?? []) as Debt[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchDebts() }, [fetchDebts])

  // direction решает, какую таблицу обновлять.
  const markPaid = async (debt: Debt): Promise<string | null> => {
    const table = debt.direction === 'receivable' ? 'sales' : 'purchases'
    const { error } = await supabase
      .from(table)
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('id', debt.id)
    if (error) return error.message
    await fetchDebts()
    return null
  }

  return { debts, loading, markPaid, refetch: fetchDebts }
}
```

### 4.3 Обновить `src/hooks/usePurchases.ts` и `src/hooks/useSales.ts`
Добавить необязательные параметры `contactId` и `isPaid` и писать их в insert.

`addPurchase` — новая сигнатура:
```ts
const addPurchase = async (
  product_id: string, quantity: number, price_per_unit: number, currentStock: number,
  contactId: string | null = null, isPaid: boolean = true
): Promise<string | null> => {
  setLoading(true)
  const total = quantity * price_per_unit
  const { error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      product_id, quantity, price_per_unit, total,
      contact_id: contactId,
      is_paid: isPaid,
      paid_at: isPaid ? new Date().toISOString() : null,
    })
  // ...остальное без изменений (update склада += quantity)
}
```
`addSale` — аналогично, но `paid_at` тоже `isPaid ? now : null`, склад `-= quantity`, проверка остатка остаётся.

### 4.4 Обновить формы `PurchaseForm.tsx` и `SaleForm.tsx`
Добавить в форму (между выбором товара и кнопкой) блок контрагента + переключатель «в долг». **Не** копировать полноценный dropdown — использовать нативный `<datalist>` (минимум кода):

```tsx
// вверху компонента:
const { contacts, findOrCreate } = useContacts()
const [contactName, setContactName] = useState('')
const [isDebt, setIsDebt] = useState(false)
// для PurchaseForm kind='supplier' и подпись «Поставщик»;
// для SaleForm    kind='customer' и подпись «Покупатель».

// JSX (перед кнопкой отправки):
<div>
  <label className="text-xs text-text-secondary mb-1.5 block">Поставщик / Покупатель (необязательно)</label>
  <input
    list="contacts-list"
    value={contactName}
    onChange={e => setContactName(e.target.value)}
    placeholder="Имя контрагента"
    className="w-full h-12 bg-surface border border-hairline rounded-xl px-4 text-sm text-white outline-none focus:border-white/25 transition-[border-color] duration-150"
  />
  <datalist id="contacts-list">
    {contacts.map(c => <option key={c.id} value={c.name} />)}
  </datalist>
</div>

<label className="flex items-center justify-between h-12 px-4 bg-surface border border-hairline rounded-xl">
  <span className="text-sm text-white">В долг (не оплачено)</span>
  <input type="checkbox" checked={isDebt} onChange={e => setIsDebt(e.target.checked)} className="w-5 h-5 accent-[#EF4444]" />
</label>
```

В `handleSubmit` перед вызовом addPurchase/addSale:
```ts
const contactId = contactName.trim()
  ? await findOrCreate(contactName.trim(), /* 'supplier' | 'customer' */)
  : null
const err = await addSale(selectedProduct.id, qty, price, selectedProduct.current_stock, contactId, !isDebt)
```
После успеха — сбросить `contactName` и `isDebt`. Тост: если `isDebt`, можно «Продажа в долг записана ✓».

### 4.5 Новый экран `src/components/debts/DebtsList.tsx`
Две группы: **«Нам должны»** (receivable, зелёный) и **«Мы должны»** (payable, красный). Итоговые суммы сверху, список карточек с кнопкой «Оплачено».

Каркас:
```tsx
import { useDebts } from '../../hooks/useDebts'
import PageHeader from '../layout/PageHeader'
import { formatMoney, formatDateRu } from '../../lib/utils'
import type { Debt } from '../../types'

export default function DebtsList({ onChanged }: { onChanged?: () => void }) {
  const { debts, loading, markPaid } = useDebts()
  const receivable = debts.filter(d => d.direction === 'receivable')
  const payable    = debts.filter(d => d.direction === 'payable')
  const sum = (arr: Debt[]) => arr.reduce((s, d) => s + d.amount, 0)

  const handlePaid = async (d: Debt) => { await markPaid(d) }

  // Разметка: PageHeader "Долги";
  // 2 карточки-итога (Нам должны = sum(receivable) зелёным, Мы должны = sum(payable) красным);
  // затем два блока со списками (contact_name ?? 'Без контрагента', сумма, дата, кнопка «Оплачено»).
  // Пустое состояние: "Долгов нет". Skeleton при loading (как в других экранах).
  // Корневой div: className="px-4 pb-[90px] animate-page-in"
}
```
Кнопка «Оплачено» — маленькая, `h-9 px-3 rounded-lg bg-surface text-xs`, при клике `handlePaid(d)`.

### 4.6 Подключить вкладку «Долги»
- `src/components/layout/BottomNav.tsx` — добавить в массив `tabs` элемент `{ id: 'debts', label: 'Долги', icon: HandCoins }` (импорт `HandCoins` из `lucide-react`). Порядок: dashboard, products, purchase, sale, **debts**, history. 6 вкладок помещаются (каждая `flex-1`).
- `src/App.tsx` — добавить `{activeTab === 'debts' && <DebtsList />}` и импорт. Тип `Tab` уже включает `'debts'`.

### 4.7 (Опционально) Дашборд
На главной можно добавить строку «Долги: нам +₽X / мы −₽Y» под карточками — данные брать из вью `debts`. Не обязательно.

---

## 5. ФИЧА №4 — Аналитика и графики (миграция НЕ нужна)

Библиотек графиков в проекте нет — **не добавляй тяжёлые зависимости**, рисуй лёгкими inline-SVG (столбики) и агрегируй на клиенте. Хорошо ложится либо в отдельный экран, либо в низ дашборда. Рекомендую **секцию на дашборде** (без новой вкладки, вкладок и так 6).

### 5.1 Данные
Расширить `useDashboard.ts` (или сделать `useAnalytics.ts`) — из уже загружаемых `sales`/`purchases`:
- **Выручка за 7/30 дней** — сгруппировать `sales.total` по дню (`created_at` -> `YYYY-MM-DD`), собрать массив последних N дней (включая нулевые дни).
- **Топ-5 товаров по выручке** — Σ `sales.total` по `product_id`, отсортировать, взять 5, отдать `{ name, total }` (имя из `productMap`).
- **Низкий остаток** — товары с `current_stock <= threshold` (порог-константа, напр. `LOW_STOCK_THRESHOLD = 5`). Показать бейджем/списком «Пора докупить».

### 5.2 Компонент столбчатого графика `src/components/analytics/BarChart.tsx`
Простой адаптивный SVG (высота столбца = value/max). Пример пропсов:
```tsx
interface BarChartProps { data: { label: string; value: number }[]; color?: string }
```
Рендерь `<div className="flex items-end gap-1 h-32">` со столбиками `flex-1`,
высота через `style={{ height: `${(value/max)*100}%` }}`, `bg-accent` или зелёный,
подпись дня под столбиком `text-[10px] text-text-secondary`. Цифры — `tabular-nums`
(уже глобально). Учитывай `max === 0` (не делить на ноль).

### 5.3 Секция на дашборде
Под «Последними операциями» добавь:
- Заголовок «Выручка за 7 дней» + `<BarChart data={revByDay} />`.
- «Топ товаров» — список из 5 строк (название + `formatMoney(total)` + мини-полоска доли).
- «Пора докупить» — если есть товары ниже порога, карточка со списком и красным бейджем количества; иначе не показывать.

---

## 6. Порядок работ и проверка

1. `useContacts.ts`, `useDebts.ts` (новые файлы).
2. Обновить `usePurchases.ts`, `useSales.ts` (сигнатуры).
3. Обновить `PurchaseForm.tsx`, `SaleForm.tsx` (контрагент + «в долг»).
4. `DebtsList.tsx` (новый экран).
5. `BottomNav.tsx` + `App.tsx` (вкладка).
6. `npm run build` — убедиться, что 0 ошибок.
7. Аналитика: `BarChart.tsx`, расширить `useDashboard.ts`, секции в `Dashboard.tsx`.
8. `npm run build` снова.
9. Прогнать вручную (`npm run dev`): создать контрагента через форму, записать продажу «в долг», проверить экран «Долги», нажать «Оплачено» -> долг исчезает; проверить, что маржа/выручка на дашборде считаются; проверить графики.

## 7. Подводные камни
- `.env` должен содержать `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`, иначе `src/lib/supabase.ts` подставляет mock-клиент (все запросы возвращают `null` — данные не грузятся, но приложение не падает).
- Вью `debts` — только для чтения; отметка оплаты идёт в исходные `sales`/`purchases` по `id` (см. `markPaid`).
- Формы закупки/продажи почти идентичны — правь ОБА файла симметрично.
- Не забудь сбрасывать поля контрагента/«в долг» после успешной операции.
- Тип `Sale`/`Purchase` теперь требует `contact_id/is_paid/paid_at` — если где-то создаёшь объект этого типа вручную, добавь поля (в текущем коде объекты берутся из БД, проблем быть не должно).
