'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { Fuel, Droplet, Wrench, CircleDot, Filter } from 'lucide-react'
import type { RecordType } from '@/lib/types'

interface ExpenseRecord {
  date: string
  type: RecordType
  value: number
  km: number | null
  vehicle_id: string
  vehicle_model: string
}

interface CostPerKmData {
  month: string
  monthLabel: string
  totalCost: number
  totalKm: number
  costPerKm: number
  cumulativeCost: number
  cumulativeKm: number
  cumulativeCostPerKm: number
  byType: Record<RecordType, { cost: number; km: number }>
}

const TYPE_COLORS: Record<RecordType, string> = {
  combustivel: '#3b82f6',
  troca_oleo: '#eab308',
  pneus: '#ef4444',
  manutencao_geral: '#22c55e',
}

const TYPE_LABELS: Record<RecordType, string> = {
  combustivel: 'Combustível',
  troca_oleo: 'Troca de Óleo',
  pneus: 'Pneus',
  manutencao_geral: 'Manutenção Geral',
}

const TYPE_ICONS: Record<RecordType, React.ElementType> = {
  combustivel: Fuel,
  troca_oleo: Droplet,
  pneus: CircleDot,
  manutencao_geral: Wrench,
}

interface CostPerKmChartProps {
  expenses: ExpenseRecord[]
  vehicleId?: string
}

export default function CostPerKmChart({ expenses, vehicleId }: CostPerKmChartProps) {
  const [selectedTypes, setSelectedTypes] = useState<RecordType[]>([
    'combustivel',
    'troca_oleo',
    'pneus',
    'manutencao_geral',
  ])
  const [timeRange, setTimeRange] = useState<'6m' | '1y'>('1y')

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      if (!selectedTypes.includes(expense.type)) return false
      if (vehicleId && expense.vehicle_id !== vehicleId) return false
      
      const expenseDate = new Date(expense.date)
      const now = new Date()
      const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6))
      const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1))
      
      if (timeRange === '6m') {
        return expenseDate >= sixMonthsAgo
      }
      return expenseDate >= oneYearAgo
    })
  }, [expenses, selectedTypes, vehicleId, timeRange])

  const chartData = useMemo(() => {
    const months: Record<string, Partial<CostPerKmData>> = {}
    
    // Agrupar despesas por mês
    filteredExpenses.forEach((expense) => {
      const date = new Date(expense.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      
      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          monthLabel,
          totalCost: 0,
          totalKm: 0,
          byType: {
            combustivel: { cost: 0, km: 0 },
            troca_oleo: { cost: 0, km: 0 },
            pneus: { cost: 0, km: 0 },
            manutencao_geral: { cost: 0, km: 0 },
          },
        }
      }
      
      months[monthKey].totalCost! += expense.value
      months[monthKey].byType![expense.type].cost += expense.value
      months[monthKey].byType![expense.type].km += expense.km || 0
    })
    
    // Ordenar por mês e calcular acumulados
    const sortedMonths = Object.keys(months).sort()
    let cumulativeCost = 0
    let cumulativeKm = 0
    
    const result: CostPerKmData[] = sortedMonths.map((key) => {
      const data = months[key] as CostPerKmData
      cumulativeCost += data.totalCost
      cumulativeKm += data.totalKm
      
      return {
        ...data,
        totalKm: data.totalKm || 1, // Evitar divisão por zero
        costPerKm: data.totalCost / (data.totalKm || 1),
        cumulativeCost,
        cumulativeKm: cumulativeKm || 1,
        cumulativeCostPerKm: cumulativeCost / (cumulativeKm || 1),
      }
    })
    
    return result
  }, [filteredExpenses])

  const toggleType = (type: RecordType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    )
  }

  const allTypesSelected = selectedTypes.length === 4
  const noTypeSelected = selectedTypes.length === 0

  const averageCostPerKm = useMemo(() => {
    if (chartData.length === 0) return 0
    const totalCost = chartData.reduce((sum, d) => sum + d.totalCost, 0)
    const totalKm = chartData.reduce((sum, d) => sum + d.totalKm, 0)
    return totalCost / (totalKm || 1)
  }, [chartData])

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-[17px] font-semibold text-[#1c1c1e]">
            Custo por KM
          </h2>
          <p className="text-[13px] text-[#8e8e93] mt-0.5">
            {timeRange === '6m' ? 'Últimos 6 meses' : 'Últimos 12 meses'}
          </p>
        </div>
        
        {/* Time Range Toggle */}
        <div className="flex items-center gap-2 bg-[#f2f2f7] rounded-full p-1">
          <button
            onClick={() => setTimeRange('6m')}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition ${
              timeRange === '6m'
                ? 'bg-white text-[#1c1c1e] shadow-sm'
                : 'text-[#8e8e93]'
            }`}
          >
            6M
          </button>
          <button
            onClick={() => setTimeRange('1y')}
            className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition ${
              timeRange === '1y'
                ? 'bg-white text-[#1c1c1e] shadow-sm'
                : 'text-[#8e8e93]'
            }`}
          >
            1A
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(TYPE_LABELS) as RecordType[]).map((type) => {
          const Icon = TYPE_ICONS[type]
          const isActive = selectedTypes.includes(type)
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium border transition ${
                isActive
                  ? 'bg-ios-blue text-white border-ios-blue'
                  : 'bg-[#f2f2f7] text-[#8e8e93] border-black/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {TYPE_LABELS[type]}
            </button>
          )
        })}
        <button
          onClick={() => setSelectedTypes(allTypesSelected ? [] : ['combustivel', 'troca_oleo', 'pneus', 'manutencao_geral'])}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium bg-[#f2f2f7] text-[#8e8e93] border border-black/5 transition"
        >
          <Filter className="w-3.5 h-3.5" />
          {allTypesSelected ? 'Limpar' : 'Todos'}
        </button>
      </div>

      {/* Summary Stats */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-[#f2f2f7] rounded-xl p-3">
            <p className="text-[11px] text-[#8e8e93] font-medium">Custo Médio/KM</p>
            <p className="text-[15px] font-semibold text-[#1c1c1e] mt-0.5">
              R$ {averageCostPerKm.toFixed(4)}
            </p>
          </div>
          <div className="bg-[#f2f2f7] rounded-xl p-3">
            <p className="text-[11px] text-[#8e8e93] font-medium">Custo Total</p>
            <p className="text-[15px] font-semibold text-[#1c1c1e] mt-0.5">
              R$ {chartData.reduce((sum, d) => sum + d.totalCost, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-[#f2f2f7] rounded-xl p-3">
            <p className="text-[11px] text-[#8e8e93] font-medium">KM Total</p>
            <p className="text-[15px] font-semibold text-[#1c1c1e] mt-0.5">
              {chartData.reduce((sum, d) => sum + d.totalKm, 0).toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="bg-[#f2f2f7] rounded-xl p-3">
            <p className="text-[11px] text-[#8e8e93] font-medium">Meses</p>
            <p className="text-[15px] font-semibold text-[#1c1c1e] mt-0.5">
              {chartData.length}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-[320px] w-full">
        {noTypeSelected ? (
          <div className="h-full flex flex-col items-center justify-center text-[#8e8e93]">
            <Filter className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-[14px]">Selecione pelo menos um tipo de despesa</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#8e8e93]">
            <p className="text-[14px]">Nenhum dado no período selecionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 11, fill: '#8e8e93' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#8e8e93' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `R$ ${value.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  padding: '12px',
                }}
                labelStyle={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}
                formatter={(value, name) => {
                  if (typeof value === 'number') {
                    if (name === 'Custo por KM') {
                      return [`R$ ${value.toFixed(4)}`, name]
                    }
                    return [`R$ ${value.toFixed(2)}`, name]
                  }
                  return [String(value), name]
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '16px' }}
                iconType="circle"
                iconSize={8}
              />
              
              {/* Linha de custo por KM mensal */}
              <Line
                type="monotone"
                dataKey="costPerKm"
                name="Custo por KM (mensal)"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              />
              
              {/* Linha de custo acumulado por KM */}
              <Line
                type="monotone"
                dataKey="cumulativeCostPerKm"
                name="Custo por KM (acumulado)"
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              
              {/* Linhas por tipo de despesa (opcional) */}
              {selectedTypes.includes('combustivel') && (
                <Line
                  type="monotone"
                  dataKey={(data) => data.byType.combustivel.cost / (data.byType.combustivel.km || 1)}
                  name="Combustível (KM)"
                  stroke={TYPE_COLORS.combustivel}
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="3 3"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Trend Analysis */}
      {chartData.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-black/5"
        >
          <div className="flex items-center gap-2">
            {chartData[chartData.length - 1].costPerKm > chartData[0].costPerKm ? (
              <>
                <span className="w-2 h-2 rounded-full bg-ios-red" />
                <p className="text-[13px] text-[#8e8e93]">
                  Tendência de <strong className="text-ios-red">alta</strong> no custo por KM
                </p>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-[13px] text-[#8e8e93]">
                  Tendência de <strong className="text-green-500">queda</strong> no custo por KM
                </p>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
