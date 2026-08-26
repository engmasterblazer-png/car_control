import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react'
import type { OilStatus } from '@/lib/types'

interface AlertBadgeProps {
  status: OilStatus
  className?: string
}

const CONFIG: Record<
  OilStatus,
  { label: string; textColor: string; bgColor: string; icon: typeof CheckCircle2 }
> = {
  em_dia: {
    label: 'Em dia',
    textColor: 'text-ios-green',
    bgColor: 'bg-ios-green/10',
    icon: CheckCircle2,
  },
  proximo: {
    label: 'Próximo da troca',
    textColor: 'text-ios-orange',
    bgColor: 'bg-ios-orange/10',
    icon: AlertTriangle,
  },
  vencido: {
    label: 'Vencido',
    textColor: 'text-ios-red',
    bgColor: 'bg-ios-red/10',
    icon: XCircle,
  },
  sem_registro: {
    label: 'Sem registro',
    textColor: 'text-[#8e8e93]',
    bgColor: 'bg-black/5',
    icon: HelpCircle,
  },
}

export default function AlertBadge({ status, className = '' }: AlertBadgeProps) {
  const { label, textColor, bgColor, icon: Icon } = CONFIG[status]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${textColor} ${bgColor} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
      {label}
    </span>
  )
}
