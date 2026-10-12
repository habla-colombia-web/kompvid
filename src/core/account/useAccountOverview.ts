import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export interface ToolAccessRow {
  tool_id: string
  required_plan: 'free' | 'pro'
  status: 'development' | 'active' | 'disabled'
}

export interface AccountOverview {
  plan: 'free' | 'pro'
  status: string
  current_period_end: string | null
  daily_limit: number | null
  usage_today: { tool_id: string; used: number }[]
  tools: ToolAccessRow[]
}

// Todo lo calcula el servidor (my_account_overview). Aqui solo se muestra.
export function useAccountOverview() {
  const [overview, setOverview] = useState<AccountOverview | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    supabase.rpc('my_account_overview').then(({ data, error: rpcError }) => {
      if (!active) return
      setOverview(rpcError ? null : (data as AccountOverview))
      setError(rpcError ? 'No se pudo cargar tu información.' : null)
      setLoaded(true)
    })
    return () => {
      active = false
    }
  }, [])

  return { overview, loaded, error }
}