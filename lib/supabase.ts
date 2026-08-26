import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Cliente Supabase para uso no BROWSER (Client Components).
 * Ex: dentro de "use client" pages/components.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Cliente Supabase para uso no SERVIDOR (Server Components,
 * Route Handlers e Server Actions). Lê/escreve cookies via next/headers.
 */
export async function createServerSupabaseClient() {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Chamado a partir de um Server Component sem permissão de escrita.
          // Pode ser ignorado com segurança pois o middleware cuida de
          // atualizar a sessão a cada requisição.
        }
      },
    },
  })
}
