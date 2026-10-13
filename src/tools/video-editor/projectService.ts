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

interface StoredProject {
  projectId?: string | null
  id: string
  owner: string
  name: string
  data: SavedData
  updated_at: string
}

interface StoredMedia {
  key: string
  owner: string
  file: File
  updated_at: string
}

const DB_NAME = 'kompvid-editor'
const DB_VERSION = 1
const STORE_PROJECTS = 'projects'
const STORE_MEDIA = 'media'
const MAX_CHARS = 5_000_000

function isValid(d: unknown): d is SavedData {
  if (!d || typeof d !== 'object') return false
  const o = d as Record<string, unknown>
  const p = o.project as Record<string, unknown> | undefined
  if (!p || !Array.isArray(p.vclips) || !Array.isArray(p.aclips) || !Array.isArray(p.texts)) return false
  if (!CANVAS_FORMATS.some((f) => f.id === p.format)) return false
  return Array.isArray(o.media)
}

function describe(err: unknown): string {
  if (err instanceof DOMException && err.name === 'QuotaExceededError') {
    return 'el almacenamiento del navegador esta lleno'
  }
  return err instanceof Error ? err.message : 'error desconocido'
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORE_MEDIA)) db.createObjectStore(STORE_MEDIA, { keyPath: 'key' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('No se pudo abrir el almacenamiento local'))
  })
}

async function run<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode)
    const req = fn(t.objectStore(store))
    t.oncomplete = () => {
      db.close()
      resolve(req.result)
    }
    t.onerror = () => {
      db.close()
      reject(t.error ?? new Error('Error de almacenamiento'))
    }
    t.onabort = () => {
      db.close()
      reject(t.error ?? new Error('Operacion cancelada'))
    }
  })
}

// Los datos son por cuenta: otra persona en el mismo navegador no ve tus proyectos.
async function ownerId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? 'sin-sesion'
}

function mediaKey(owner: string, m: { kind: MediaKind; name: string; size: number }): string {
  return owner + '|' + m.kind + '|' + m.name + '|' + m.size
}

export async function listProjects(): Promise<{ rows: ProjectRow[]; error: string | null }> {
  try {
    const owner = await ownerId()
    const all = await run<StoredProject[]>(STORE_PROJECTS, 'readonly', (s) => s.getAll())
    const rows = all
      .filter((p) => p.owner === owner && !p.id.startsWith('draft|'))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 100)
      .map((p) => ({ id: p.id, name: p.name, updated_at: p.updated_at }))
    return { rows, error: null }
  } catch (err) {
    console.error('Kompvid listar proyectos:', err)
    return { rows: [], error: 'No se pudo leer tus proyectos del navegador: ' + describe(err) }
  }
}

export async function saveProject(
  id: string | null,
  name: string,
  data: SavedData,
): Promise<{ id: string | null; error: string | null }> {
  if (JSON.stringify(data).length > MAX_CHARS) {
    return { id: null, error: 'El proyecto es demasiado grande para guardarlo.' }
  }
  try {
    const owner = await ownerId()
    let rowId = id ?? crypto.randomUUID()
    if (id) {
      const existing = await run<StoredProject | undefined>(STORE_PROJECTS, 'readonly', (s) => s.get(id))
      if (existing && existing.owner !== owner) rowId = crypto.randomUUID()
    }
    const rec: StoredProject = { id: rowId, owner, name, data, updated_at: new Date().toISOString() }
    await run(STORE_PROJECTS, 'readwrite', (s) => s.put(rec))
    void pruneMedia()
    return { id: rowId, error: null }
  } catch (err) {
    console.error('Kompvid guardar proyecto:', err)
    return { id: null, error: 'No se pudo guardar el proyecto: ' + describe(err) }
  }
}

export async function loadProject(
  id: string,
): Promise<{ row: { id: string; name: string; data: SavedData } | null; error: string | null }> {
  try {
    const owner = await ownerId()
    const rec = await run<StoredProject | undefined>(STORE_PROJECTS, 'readonly', (s) => s.get(id))
    if (!rec || rec.owner !== owner) return { row: null, error: 'No se pudo abrir el proyecto.' }
    if (!isValid(rec.data)) return { row: null, error: 'El proyecto guardado esta danado y no se puede abrir.' }
    return { row: { id: rec.id, name: rec.name, data: rec.data }, error: null }
  } catch (err) {
    console.error('Kompvid abrir proyecto:', err)
    return { row: null, error: 'No se pudo abrir el proyecto: ' + describe(err) }
  }
}

export async function deleteProject(id: string): Promise<{ error: string | null }> {
  try {
    const owner = await ownerId()
    const rec = await run<StoredProject | undefined>(STORE_PROJECTS, 'readonly', (s) => s.get(id))
    if (rec && rec.owner === owner) {
      await run(STORE_PROJECTS, 'readwrite', (s) => s.delete(id))
      await pruneMedia()
    }
    return { error: null }
  } catch (err) {
    console.error('Kompvid eliminar proyecto:', err)
    return { error: 'No se pudo eliminar el proyecto: ' + describe(err) }
  }
}

// ---------- Archivos (videos, imagenes, audio) guardados en el navegador ----------

export async function putMedia(file: File, kind: MediaKind): Promise<string | null> {
  try {
    const owner = await ownerId()
    const rec: StoredMedia = {
      key: mediaKey(owner, { kind, name: file.name, size: file.size }),
      owner,
      file,
      updated_at: new Date().toISOString(),
    }
    await run(STORE_MEDIA, 'readwrite', (s) => s.put(rec))
    return null
  } catch (err) {
    console.error('Kompvid guardar archivo:', err)
    return 'No se pudo guardar el archivo en el navegador: ' + describe(err)
  }
}

export async function getMediaFile(ref: MediaRef): Promise<File | null> {
  try {
    const owner = await ownerId()
    const rec = await run<StoredMedia | undefined>(STORE_MEDIA, 'readonly', (s) => s.get(mediaKey(owner, ref)))
    return rec ? rec.file : null
  } catch (err) {
    console.error('Kompvid leer archivo:', err)
    return null
  }
}

// Borra del navegador los archivos que ya no usa ningun proyecto guardado.
export async function pruneMedia(): Promise<void> {
  try {
    const owner = await ownerId()
    const projects = await run<StoredProject[]>(STORE_PROJECTS, 'readonly', (s) => s.getAll())
    const used = new Set<string>()
    for (const p of projects) {
      if (p.owner !== owner) continue
      for (const m of p.data.media) used.add(mediaKey(owner, m))
    }
    const keys = (await run<IDBValidKey[]>(STORE_MEDIA, 'readonly', (s) => s.getAllKeys())) as string[]
    for (const key of keys) {
      if (key.startsWith(owner + '|') && !used.has(key)) {
        await run(STORE_MEDIA, 'readwrite', (s) => s.delete(key))
      }
    }
  } catch (err) {
    console.error('Kompvid limpiar archivos:', err)
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage.persist()) ?? false
  } catch {
    return false
  }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    const e = await navigator.storage.estimate()
    if (e.usage === undefined || e.quota === undefined) return null
    return { usage: e.usage, quota: e.quota }
  } catch {
    return null
  }
}

// ---------- Borrador automatico (ultimo estado del editor) ----------

export interface Draft {
  projectId: string | null
  name: string
  data: SavedData
}

export async function saveDraft(draft: Draft): Promise<string | null> {
  if (JSON.stringify(draft.data).length > MAX_CHARS) {
    return 'El proyecto es demasiado grande para el guardado automatico.'
  }
  try {
    const owner = await ownerId()
    const rec: StoredProject = {
      id: 'draft|' + owner,
      owner,
      name: draft.name,
      data: draft.data,
      projectId: draft.projectId,
      updated_at: new Date().toISOString(),
    }
    await run(STORE_PROJECTS, 'readwrite', (s) => s.put(rec))
    return null
  } catch (err) {
    console.error('Kompvid guardado automatico:', err)
    return 'No se pudo guardar automaticamente: ' + describe(err)
  }
}

export async function loadDraft(): Promise<Draft | null> {
  try {
    const owner = await ownerId()
    const rec = await run<StoredProject | undefined>(STORE_PROJECTS, 'readonly', (s) => s.get('draft|' + owner))
    if (!rec || rec.owner !== owner || !isValid(rec.data)) return null
    return { projectId: rec.projectId ?? null, name: rec.name, data: rec.data }
  } catch (err) {
    console.error('Kompvid leer borrador:', err)
    return null
  }
}