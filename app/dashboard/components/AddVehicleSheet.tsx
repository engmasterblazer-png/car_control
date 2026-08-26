'use client'

import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface AddVehicleSheetProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddVehicleSheet({
  isOpen,
  onClose,
  onSuccess,
}: AddVehicleSheetProps) {
  const supabase = createClient()

  const [model, setModel] = useState('')
  const [plate, setPlate] = useState('')
  const [year, setYear] = useState('')
  const [kmAtual, setKmAtual] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setModel('')
    setPlate('')
    setYear('')
    setKmAtual('')
    setError(null)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!model.trim() || !plate.trim()) {
      setError('Preencha modelo e placa.')
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Sessão expirada. Faça login novamente.')

      const { error: insertError } = await supabase.from('vehicles').insert({
        user_id: user.id,
        model: model.trim(),
        plate: plate.trim().toUpperCase(),
        year: year ? Number(year) : null,
        km_atual: kmAtual ? Number(kmAtual) : 0,
      })

      if (insertError) throw insertError

      onSuccess()
      handleClose()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível salvar o veículo.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-lg bg-white rounded-t-ios-sheet shadow-ios-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1.5 rounded-full bg-black/15" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <h2 className="text-[17px] font-semibold text-[#1c1c1e]">
                Novo veículo
              </h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center active:scale-90 transition"
                aria-label="Fechar"
              >
                <X className="w-4 h-4 text-[#3a3a3c]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-4">
              <div>
                <label className="text-xs font-medium text-[#8e8e93] px-1 mb-1 block">
                  Modelo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Honda Civic"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#f2f2f7] rounded-ios px-3.5 py-3 border border-black/5 outline-none text-[15px] focus:ring-2 focus:ring-ios-blue/40 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#8e8e93] px-1 mb-1 block">
                    Placa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ABC1D23"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    className="w-full bg-[#f2f2f7] rounded-ios px-3.5 py-3 border border-black/5 outline-none text-[15px] uppercase focus:ring-2 focus:ring-ios-blue/40 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8e8e93] px-1 mb-1 block">
                    Ano
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="2022"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-[#f2f2f7] rounded-ios px-3.5 py-3 border border-black/5 outline-none text-[15px] focus:ring-2 focus:ring-ios-blue/40 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#8e8e93] px-1 mb-1 block">
                  KM atual
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ex: 32000"
                  value={kmAtual}
                  onChange={(e) => setKmAtual(e.target.value)}
                  className="w-full bg-[#f2f2f7] rounded-ios px-3.5 py-3 border border-black/5 outline-none text-[15px] focus:ring-2 focus:ring-ios-blue/40 transition"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 bg-ios-red/10 text-ios-red rounded-ios px-3 py-2.5 text-[13px] font-medium"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-ios-blue text-white font-medium text-[15px] rounded-ios py-3.5 active:scale-[0.98] transition disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Adicionar veículo
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
