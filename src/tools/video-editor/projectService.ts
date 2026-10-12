import { supabase } from '../../lib/supabase'
import { CANVAS_FORMATS, type MediaKind, type Project } from './types'

export interface MediaRef {
  id: string
  name: string
  size: number
  kind: MediaKind
}

export interface SavedData {
  project: Project
  media: MediaRef[]
}

export interface ProjectRow {
  id: string
  name: string
  updated_at: string
}

const MAX_CHARS = 250000

function isValid(d: unknown): d is SavedData {
  if (!d || typeof d !== 'object') return false
  const o = d as Record<string, unknown>
  const p = o.project as Record<string, unknown> | undefined
  if (!p || !Array.isArray(p.vclips) || !Array.isArray(p.aclips) || !Array.isArray(p.texts)) return false
  if (!CANVAS_FORMATS.some((f) => f.id === p.format)) return false
  return Array.isArray(o.media)
}

export async function listProjects(): Promise<{ rows: ProjectRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('video_projects')
    .select('id,name,updated_at')
    .order('updated_at', { ascending: false })
    .limit(100)
  if (error) return { rows: [], error: 'No se pudo cargar tu lista de proyectos.' }
  return { rows: (data ?? []) as ProjectRow[], error: null }
}

export async function saveProject(
  id: string | null,
  name: string,
  data: SavedData,
): Promise<{ id: string | null; error: string | null }> {
  if (JSON.stringify(data).length > MAX_CHARS) {
    return { id: null, error: 'El proyecto es demasiado grande para guardarlo.' }
  }
  const query = id
    ? supabase.from('video_projects').update({ name, data }).eq('id', id).select('id').single()
    : supabase.from('video_projects').insert({ name, data }).select('id').single()
  const { data: row, error } = await query
  if (error || !row) return { id: null, error: 'No se pudo guardar el proyecto. Inicia sesion e intentalo de nuevo.' }
  return { id: (row as { id: string }).id, error: null }
}

export async function loadProject(
  id: string,
): Promise<{ row: { id: string; name: string; data: SavedData } | null; error: string | null }> {
  const { data, error } = await supabase.from('video_projects').select('id,name,data').eq('id', id).single()
  if (error || !data) return { row: null, error: 'No se pudo abrir el proyecto.' }
  const row = data as { id: string; name: string; data: unknown }
  if (!isValid(row.data)) return { row: null, error: 'El proyecto guardado esta danado y no se puede abrir.' }
  return { row: { id: row.id, name: row.name, data: row.data }, error: null }
}

export async function deleteProject(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('video_projects').delete().eq('id', id)
  return { error: error ? 'No se pudo eliminar el proyecto.' : null }
}