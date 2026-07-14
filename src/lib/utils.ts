export function formatMoney(amount: number): string {
  if (amount === 0) return '₽0'
  const formatted = Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${amount < 0 ? '-' : ''}₽${formatted}`
}

export function formatDateRu(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const dateDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (dateDay.getTime() === today.getTime()) return 'Сегодня'
  if (dateDay.getTime() === yesterday.getTime()) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}
