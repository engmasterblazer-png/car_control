import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import type { IpvaStatus } from '@/lib/types'

interface IpvaBadgeProps {
  status: IpvaStatus
}

const CONFIG: Record<
  IpvaStatus,
  { label: string; textColor: string; bgColor: string; icon: typeof CheckCircle2 }
> = {
  em_dia: {
    label: 'Em dia',
    textColor: 'text-ios-green',
    bgColor: 'bg-ios-green/10',
    icon: CheckCircle2,
  },
  proximo: {
    label: 'Próximo do vencimento',
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
}

export default function IpvaBadge({ status }: IpvaBadgeProps) {
  const { label, textColor, bgColor, icon: Icon } = CONFIG[status]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${textColor} ${bgColor}`}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
      {label}
    </span>
  )
}