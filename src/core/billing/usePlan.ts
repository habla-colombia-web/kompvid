import { useAccountOverview } from '../account/useAccountOverview'
import type { PlanId } from '../tools/types'

// Solo para mostrar el plan en pantalla. El plan efectivo lo calcula la base de datos.
export function usePlan(): { plan: PlanId; loaded: boolean } {
  const { overview, loaded } = useAccountOverview()
  return { plan: overview?.plan === 'pro' ? 'pro' : 'free', loaded }
}