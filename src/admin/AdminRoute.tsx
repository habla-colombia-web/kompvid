import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../core/auth/useAuth'
import { supabase } from '../lib/supabase'

export type StaffRole = 'admin' | 'support'

export default function AdminRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const userId = session?.user?.id
  const [role, setRole] = useState<StaffRole | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!userId) {
      setChecking(false)
      return
    }
    let cancelled = false
    setChecking(true)
    supabase.rpc('current_staff_role').then(({ data, error }) => {
      if (cancelled) return
      setRole(!error && (data === 'admin' || data === 'support') ? data : null)
      setChecking(false)
    })
    return () => {
      cancelled = true
    }
  }, [userId, loading])

  if (loading || checking) return <p className="page-status">Verificando acceso...</p>
  if (!userId) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!role) return <Navigate to="/" replace />
  return <Outlet context={{ role }} />
}