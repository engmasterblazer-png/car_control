'use client'

import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  Fuel,
  Droplet,
  Wrench,
  CircleDot,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { RECORD_TYPE_LABELS, type RecordType } from '@/lib/types'

interface AddExpenseSheetProps {
  isOpen: boolean
  onClose: () => void
  vehicleId: string | null
  onSuccess: () => void
}

const TYPE_OPTIONS: { value: RecordType; icon: typeof Fuel }[] = [
  { value: 'troca_oleo', icon: Droplet },
  { value: 'pneus', icon: CircleDot },
  { value: 'manutencao_geral', icon: Wrench },
  { value: 'combustivel', icon: Fuel },
]

export default function AddExpenseSheet({
  isOpen,
  onClose,
  vehicleId,
  onSuccess,
}: AddExpenseSheetProps) {
  const supabase = createClient()

  const [type, setType] = useState<RecordType>('troca_oleo')
  const [value, setValue] = useState('')
  const [km, setKm] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setType('troca_oleo')
    setValue('')
    setKm('')
    setDate(new Date().toISOString().slice(0, 10))
    setNotes('')
    setError(null)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!vehicleId) return

    setError(null)

    const parsedValue = Number(value.replace(',', '.'))
    const parsedKm = Number(km.replace(',', '.'))

    if (!parsedKm || parsedKm <= 0) {
      setError('Informe um KM válido.')
      return
    }
    if (value !== '' && Number.isNaN(parsedValue)) {
      setError('Informe um valor válido.')
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Sessão expirada. Faça login novamente.')

      const { error: insertError } = await supabase.from('records').insert({
        vehicle_id: vehicleId,
        user_id: user.id,
        type,
        value: parsedValue || 0,
        km: parsedKm,
        date,
        notes: notes.trim() || null,
      })

      if (insertError) throw insertError

      onSuccess()
      handleClose()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível salvar o registro.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-lg bg-white rounded-t-ios-sheet shadow-ios-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1.5 rounded-full bg-black/15" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-1">
              <h2 className="text-[17px] font-semibold text-[#1c1c1e]">
                Novo registro
              </h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center active:scale-90 transition"
                aria-label="Fechar"
              >
                <X className="w-4 h-4 text-[#3a3a3c]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-5">
              {/* Tipo */}
              <div>
                <label className="text-xs font-medium text-[#8e8e93] px-1 mb-2 block">
                  Tipo de registro
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {TYPE_OPTIONS.map(({ value: optValue, icon: Icon }) => {
                    const active = type === optValue
                    return (
                      <button
                        key={optValue}
                        type="button"
                        onClick={() => setType(optValue)}
                        className={`flex items-center gap-2 rounded-ios px-3.5 py-3 border transition ${
                          active
                            ? 'bg-ios-blue text-white border-ios-blue'
                            : 'bg-[#f2f2f7] text-[#3a3a3c] border-black/5'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${active ? 'text-white' : 'text-[#8e8e93]'}`}
                        />
                        <span className="text-[13.5px] font-medium">
                          {RECORD_TYPE_LABELS[optValue]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Valor + KM */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#8e8e93] px-1 mb-1 block">
                    Valor (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-[#f2f2f7] rounded-ios px-3.5 py-3 border border-black/5 outline-none text-[15px] focus:ring-2 focus:ring-ios-blue/40 transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8e8e93] px-1 mb-1 block">
                    KM atual *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Ex: 45000"
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    className="w-full bg-[#f2f2f7] rounded-ios px-3.5 py-3 border border-black/5 outline-none text-[15px] focus:ring-2 focus:ring-ios-blue/40 transition"
                  />
                </div>
              </div>

              {/* Data */}
              <div>
                <label className="text-xs font-medium text-[#8e8e93] px-1 mb-1 block">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#f2f2f7] rounded-ios px-3.5 py-3 border border-black/5 outline-none text-[15px] focus:ring-2 focus:ring-ios-blue/40 transition"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs font-medium text-[#8e8e93] px-1 mb-1 block">
                  Observações
                </label>
                <textarea
                  rows={3}
                  placeholder="Opcional"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#f2f2f7] rounded-ios px-3.5 py-3 border border-black/5 outline-none text-[15px] resize-none focus:ring-2 focus:ring-ios-blue/40 transition"
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
                Salvar registro
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
