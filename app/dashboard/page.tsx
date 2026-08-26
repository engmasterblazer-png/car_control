'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Car, LogOut, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { VehicleAlert } from '@/lib/types'
import VehicleCard from './components/VehicleCard'
import AddExpenseSheet from './components/AddExpenseSheet'
import AddVehicleSheet from './components/AddVehicleSheet'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [vehicles, setVehicles] = useState<VehicleAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false)
  const [vehicleSheetOpen, setVehicleSheetOpen] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUserEmail(user.email ?? null)

    const { data, error } = await supabase
      .from('vehicle_alerts')
      .select('*')
      .order('model', { ascending: true })

    if (!error && data) {
      setVehicles(data as VehicleAlert[])
    }

    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleDeleteVehicle(vehicleId: string) {
    const confirmed = window.confirm(
      'Remover este veículo? Todos os registros associados também serão excluídos.'
    )
    if (!confirmed) return

    const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId)
    if (!error) {
      setVehicles((prev) => prev.filter((v) => v.vehicle_id !== vehicleId))
    }
  }

  function openExpenseSheet(vehicleId: string) {
    setSelectedVehicleId(vehicleId)
    setExpenseSheetOpen(true)
  }

  const totalVencidos = vehicles.filter((v) => v.oil_status === 'vencido').length

  return (
    <div className="min-h-screen bg-[#f2f2f7] pb-28">
      {/* Header glass fixo */}
      <header className="glass fixed top-0 left-0 right-0 z-30 px-5 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-ios bg-ios-blue flex items-center justify-center">
              <Car className="w-4.5 h-4 text-white" strokeWidth={2.4} />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold leading-tight text-[#1c1c1e]">
                Minha Frota
              </h1>
              {userEmail && (
                <p className="text-[11px] text-[#8e8e93] leading-tight">
                  {userEmail}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center active:scale-90 transition"
            aria-label="Sair"
          >
            <LogOut className="w-4 h-4 text-[#3a3a3c]" />
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-5xl mx-auto pt-24 px-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#8e8e93]">
            <Loader2 className="w-6 h-6 animate-spin mb-3" />
            <p className="text-[14px]">Carregando sua frota...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-ios-blue/10 flex items-center justify-center mb-4">
              <Car className="w-7 h-7 text-ios-blue" />
            </div>
            <h2 className="text-[17px] font-semibold text-[#1c1c1e] mb-1">
              Nenhum veículo cadastrado
            </h2>
            <p className="text-[14px] text-[#8e8e93] max-w-xs">
              Adicione seu primeiro veículo para começar a acompanhar despesas e
              manutenções.
            </p>
          </div>
        ) : (
          <>
            {totalVencidos > 0 && (
              <div className="mb-5 flex items-center gap-2 bg-ios-red/10 text-ios-red rounded-ios px-4 py-3 text-[13.5px] font-medium">
                {totalVencidos === 1
                  ? '1 veículo está com a revisão vencida.'
                  : `${totalVencidos} veículos estão com a revisão vencida.`}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {vehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.vehicle_id}
                    vehicle={vehicle}
                    onAddExpense={openExpenseSheet}
                    onDelete={handleDeleteVehicle}
                  />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {/* Floating Action Button - adicionar veículo */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setVehicleSheetOpen(true)}
        className="fixed bottom-8 right-6 z-30 w-14 h-14 rounded-full bg-ios-blue text-white shadow-ios-lg flex items-center justify-center"
        aria-label="Adicionar veículo"
      >
        <Plus className="w-6 h-6" strokeWidth={2.4} />
      </motion.button>

      {/* Bottom sheets */}
      <AddExpenseSheet
        isOpen={expenseSheetOpen}
        onClose={() => setExpenseSheetOpen(false)}
        vehicleId={selectedVehicleId}
        onSuccess={loadData}
      />

      <AddVehicleSheet
        isOpen={vehicleSheetOpen}
        onClose={() => setVehicleSheetOpen(false)}
        onSuccess={loadData}
      />
    </div>
  )
}
