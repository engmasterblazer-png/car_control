'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Car, Mail, Lock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type Mode = 'login' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError

        router.push('/dashboard')
        router.refresh()
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError

        setSuccessMessage(
          'Cadastro realizado! Verifique seu e-mail para confirmar a conta e depois faça login.'
        )
        setMode('login')
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ocorreu um erro inesperado.'
      setError(translateAuthError(message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center px-4 bg-[#f2f2f7]">
      <div className="w-full max-w-sm">
        {/* Logo / título */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-ios-lg bg-ios-blue flex items-center justify-center shadow-ios-lg mb-4">
            <Car className="w-8 h-8 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1c1c1e]">
            Gestão de Frota
          </h1>
          <p className="text-sm text-[#8e8e93] mt-1">
            {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta gratuita'}
          </p>
        </div>

        {/* Card do formulário */}
        <div className="ios-card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#8e8e93] px-1 mb-1 block">
                E-mail
              </label>
              <div className="flex items-center gap-2 bg-[#f2f2f7] rounded-ios px-3.5 py-3 border border-black/5 focus-within:ring-2 focus-within:ring-ios-blue/40 transition">
                <Mail className="w-4 h-4 text-[#8e8e93] shrink-0" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none text-[15px] placeholder:text-[#c7c7cc]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#8e8e93] px-1 mb-1 block">
                Senha
              </label>
              <div className="flex items-center gap-2 bg-[#f2f2f7] rounded-ios px-3.5 py-3 border border-black/5 focus-within:ring-2 focus-within:ring-ios-blue/40 transition">
                <Lock className="w-4 h-4 text-[#8e8e93] shrink-0" />
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-[15px] placeholder:text-[#c7c7cc]"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
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
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 bg-ios-green/10 text-ios-green rounded-ios px-3 py-2.5 text-[13px] font-medium"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-ios-blue text-white font-medium text-[15px] rounded-ios py-3.5 mt-2 active:scale-[0.98] transition disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>

        {/* Alternar modo */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError(null)
              setSuccessMessage(null)
            }}
            className="text-[15px] text-ios-blue font-medium active:opacity-60 transition"
          >
            {mode === 'login'
              ? 'Ainda não tem conta? Cadastre-se'
              : 'Já tem uma conta? Entrar'}
          </button>
        </div>
      </div>
    </main>
  )
}

function translateAuthError(message: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': 'E-mail ou senha inválidos.',
    'User already registered': 'Este e-mail já está cadastrado.',
    'Password should be at least 6 characters':
      'A senha deve ter no mínimo 6 caracteres.',
    'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
  }
  return map[message] ?? message
}
