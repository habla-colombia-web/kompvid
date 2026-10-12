import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { PlanId } from '../tools/types'

interface SubscriptionRow {
  plan: string
  status: string
  current_period_end: string | null
}

// Solo para mostrar el plan en pantalla. El limite real lo aplica la base de datos.
export function usePlan(): { plan: PlanId; loaded: boolean } {
  const [plan, setPlan] = useState<PlanId>('free')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    supabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        const row = data as SubscriptionRow | null
        const paidPeriodOpen =
          row?.status === 'canceled' &&
          !!row.current_period_end &&
          new Date(row.current_period_end) > new Date()
        const isPro = row?.plan === 'pro' && (row.status === 'active' || paidPeriodOpen)
        setPlan(isPro ? 'pro' : 'free')
        setLoaded(true)
      })
    return () => {
      active = false
    }
  }, [])

  return { plan, loaded }
}