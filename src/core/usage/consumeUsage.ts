import { supabase } from '../../lib/supabase'

export interface UsageResult {
  allowed: boolean
  plan?: string
  used?: number
  limit?: number | null
  reason?: string
}

export async function consumeUsage(
  toolId: string,
): Promise<{ result: UsageResult | null; error: string | null }> {
  const { data, error } = await supabase.rpc('consume_usage', { p_tool_id: toolId })
  if (error) {
    return { result: null, error: 'No se pudo verificar tu límite de uso. Inténtalo de nuevo.' }
  }
  return { result: data as UsageResult, error: null }
}