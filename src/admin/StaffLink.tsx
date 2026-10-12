import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../core/auth/useAuth'
import { supabase } from '../lib/supabase'

export default function StaffLink({ className }: { className?: string }) {
  const { session } = useAuth()
  const userId = session?.user?.id
  const [isStaff, setIsStaff] = useState(false)

  useEffect(() => {
    if (!userId) {
      setIsStaff(false)
      return
    }
    let cancelled = false
    supabase.rpc('current_staff_role').then(({ data, error }) => {
      if (!cancelled) setIsStaff(!error && (data === 'admin' || data === 'support'))
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (!isStaff) return null
  return <Link to="/admin" className={className}>Panel</Link>
}