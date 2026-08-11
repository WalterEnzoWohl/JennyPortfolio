import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { supabase } from './supabaseClient'

const ADMIN_EMAIL = 'admin@jennyportfolio.local'

export default function AdminPage({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<'checking' | 'anonymous' | 'authenticated'>('checking')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  useEffect(() => {
    let active = true

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (!active) return

      const isAdmin = !error && data.user?.app_metadata?.role === 'portfolio_admin'
      setAuthState(isAdmin ? 'authenticated' : 'anonymous')
    }

    void checkSession()
    return () => {
      active = false
    }
  }, [])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthBusy(true)
    setAuthError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password,
      })

      if (error || data.user?.app_metadata?.role !== 'portfolio_admin') {
        if (data.session) await supabase.auth.signOut()
        setAuthError('Contraseña incorrecta.')
        return
      }

      setAuthState('authenticated')
      setPassword('')
    } catch {
      setAuthError('No se pudo conectar con el servidor de administración.')
    } finally {
      setAuthBusy(false)
    }
  }

  if (authState === 'authenticated') return children

  return (
    <main className="admin-shell admin-login-shell">
      <form className="admin-login-card" onSubmit={handleLogin}>
        <p className="admin-kicker">JennyPortfolio</p>
        <h1>Administrador</h1>
        {authState === 'checking' ? (
          <p className="admin-login-status">Verificando sesión...</p>
        ) : (
          <>
            <label>
              Contraseña
              <input
                autoFocus
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>
            {authError ? <p className="admin-error">{authError}</p> : null}
            <button type="submit" disabled={authBusy || !password.trim()}>
              {authBusy ? 'Validando...' : 'Entrar'}
            </button>
          </>
        )}
      </form>
    </main>
  )
}
