import { supabase } from '../../lib/supabase'

export interface LimitRow {
  plan: 'free' | 'pro'
  max_seconds: number
  max_short_side: number
  max_vclips: number
  max_aclips: number
  max_texts: number
  max_media: number
  max_projects: number
}

export interface EditorLimits {
  maxSeconds: number
  maxShortSide: number
  maxVClips: number
  maxAClips: number
  maxTexts: number
  maxMedia: number
  maxProjects: number
}

export const LIMIT_FIELDS: [keyof Omit<LimitRow, 'plan'>, string][] = [
  ['max_seconds', 'Duracion maxima (s)'],
  ['max_short_side', 'Resolucion maxima (480, 720 o 1080)'],
  ['max_vclips', 'Clips de video'],
  ['max_aclips', 'Clips de audio'],
  ['max_texts', 'Textos'],
  ['max_media', 'Archivos importados'],
  ['max_projects', 'Proyectos guardados'],
]

export function rowToLimits(r: LimitRow): EditorLimits {
  return {
    maxSeconds: r.max_seconds,
    maxShortSide: r.max_short_side,
    maxVClips: r.max_vclips,
    maxAClips: r.max_aclips,
    maxTexts: r.max_texts,
    maxMedia: r.max_media,
    maxProjects: r.max_projects,
  }
}

export async function loadEditorLimits(): Promise<{ rows: LimitRow[]; error: string | null }> {
  const { data, error } = await supabase.from('editor_limits').select('*').order('plan')
  if (error) return { rows: [], error: 'No se pudieron cargar los limites.' }
  return { rows: (data ?? []) as LimitRow[], error: null }
}