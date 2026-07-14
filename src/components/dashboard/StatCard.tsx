import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  color: string
}

export default function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-card border border-white/10 rounded-[20px] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#737373]">{title}</span>
        <Icon size={20} color={color} />
      </div>
      <span className="text-xl font-semibold text-white">{value}</span>
    </div>
  )
}
