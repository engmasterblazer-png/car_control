'use client'

import { motion } from 'framer-motion'
import { Car, Gauge, Plus, Trash2, Droplet, CalendarDays } from 'lucide-react'
import AlertBadge from './AlertBadge'
import IpvaBadge from './IpvaBadge'
import type { RecordType, VehicleAlert } from '@/lib/types'

interface FuelExpense {
  type: RecordType
  km: number | null
  litros: number | null
}

interface VehicleCardProps {
  vehicle: VehicleAlert
  fuelExpenses: FuelExpense[]
  onAddExpense: (vehicleId: string) => void
  onDelete: (vehicleId: string) => void
}

export default function VehicleCard({
  vehicle,
  fuelExpenses,
  onAddExpense,
  onDelete,
}: VehicleCardProps) {
  const kmFormatted = new Intl.NumberFormat('pt-BR').format(vehicle.km_atual)
  const ipvaDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${vehicle.ipva_due_date}T00:00:00`))
  const sortedFuelExpenses = [...fuelExpenses]
    .filter((expense) => expense.km !== null && expense.litros !== null && expense.litros > 0)
    .sort((first, second) => first.km! - second.km!)
  const consumptionReadings = sortedFuelExpenses.slice(1).flatMap((expense, index) => {
    const distance = expense.km! - sortedFuelExpenses[index].km!
    return distance > 0 ? [distance / expense.litros!] : []
  })
  const averageConsumption = consumptionReadings.length > 0
    ? consumptionReadings.reduce((sum, reading) => sum + reading, 0) / consumptionReadings.length
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="ios-card p-5 flex flex-col gap-4"
    >
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-ios bg-ios-blue/10 flex items-center justify-center shrink-0">
            <Car className="w-5.5 h-5 text-ios-blue" strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="font-semibold text-[16px] leading-tight text-[#1c1c1e]">
              {vehicle.model}
            </h3>
            <p className="text-[13px] text-[#8e8e93] tracking-wide font-medium uppercase">
              {vehicle.plate}
              {vehicle.year ? ` · ${vehicle.year}` : ''}
            </p>
            {vehicle.cor && (
              <p className="text-[12px] text-[#8e8e93]">{vehicle.cor}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(vehicle.vehicle_id)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#c7c7cc] hover:text-ios-red hover:bg-ios-red/10 active:scale-90 transition shrink-0"
          aria-label="Remover veículo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* KM atual */}
      <div className="flex items-center gap-2 bg-[#f2f2f7] rounded-ios px-3.5 py-2.5">
        <Gauge className="w-4 h-4 text-[#8e8e93]" />
        <span className="text-[14px] text-[#3a3a3c]">
          <span className="font-semibold text-[#1c1c1e]">{kmFormatted}</span> km
          rodados
        </span>
      </div>

      {/* Consumo médio */}
      <div className="flex items-center justify-between text-[13px] text-[#8e8e93]">
        <span>Consumo médio</span>
        <span className="font-semibold text-[#1c1c1e]">
          {averageConsumption === null ? 'Sem dados suficientes' : `${averageConsumption.toFixed(2)} km/L`}
        </span>
      </div>

      {/* Status de óleo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] text-[#8e8e93]">
          <Droplet className="w-3.5 h-3.5" />
          <span>Troca de óleo</span>
        </div>
        <AlertBadge status={vehicle.oil_status} />
      </div>

      {(vehicle.oil_status === 'proximo' || vehicle.oil_status === 'vencido') && (
        <p className="text-[12px] text-[#8e8e93] -mt-2">
          {vehicle.km_since_last_oil} km e {vehicle.days_since_last_oil} dias desde a
          última troca.
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] text-[#8e8e93]">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>IPVA · cota única ({ipvaDate})</span>
        </div>
        <IpvaBadge status={vehicle.ipva_status} />
      </div>

      {/* Ação */}
      <button
        onClick={() => onAddExpense(vehicle.vehicle_id)}
        className="w-full flex items-center justify-center gap-1.5 bg-ios-blue/10 text-ios-blue font-medium text-[14px] rounded-ios py-2.5 active:scale-[0.98] transition"
      >
        <Plus className="w-4 h-4" strokeWidth={2.4} />
        Registrar despesa
      </button>
    </motion.div>
  )
}
