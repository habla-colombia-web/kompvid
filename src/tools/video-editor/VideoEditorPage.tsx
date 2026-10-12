import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import './editor.css'
import { PLANS } from '../../config/product'
import { usePlan } from '../../core/billing/usePlan'
import { consumeUsage } from '../../core/usage/consumeUsage'
import { cancelCompression, loadEngine } from '../video-compressor/ffmpegService'
import { formatBytes } from '../video-compressor/utils'
import { exportProject } from './exportService'
import { loadEditorLimits, rowToLimits, type EditorLimits } from './limitsService'
import { deleteProject, listProjects, loadProject, saveProject, type MediaRef, type ProjectRow } from './projectService'
import {
  CANVAS_FORMATS,
  EMPTY_PROJECT,
  FORMAT_PRESETS,
  TRACKS,
  clipDuration,
  totalDuration,
  uid,
  videoStarts,
  type AClip,
  type CanvasFormatId,
  type MediaItem,
  type MediaKind,
  type Project,
  type TextClip,
  type VClip,
} from './types'

const LIMITS = {
  free: { maxSeconds: 120, maxShortSide: 720, maxVClips: 10, maxAClips: 3, maxTexts: 5, maxMedia: 10 },
  pro: { maxSeconds: 600, maxShortSide: 1080, maxVClips: 50, maxAClips: 10, maxTexts: 30, maxMedia: 30 },
}
const PRO_FILE_CAP_MB = 500
const IMAGE_SECONDS = 5

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp']
const VIDEO_EXT = ['mp4', 'webm', 'mov', 'm4v']
const AUDIO_EXT = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac']

const SIDE_FUTURE = [
  
  { label: 'Biblioteca de recursos', tag: 'Futuro' },
  
  
]

interface Hist {
  past: Project[]
  present: Project
  future: Project[]
}

type Sel = { kind: 'v' | 't' | 'a'; id: string } | null

function fmt(sec: number): string {
  const s = Math.max(0, sec)
  const m = Math.floor(s / 60)
  return m + ':' + (s % 60).toFixed(1).padStart(4, '0')
}

function usageMessage(reason?: string, limit?: number | null): string {
  if (reason === 'limit_reached') {
    return 'Alcanzaste el limite de ' + (limit ?? 0) + ' usos por dia en esta herramienta. El contador se reinicia a las 7:00 p. m. (hora de Colombia).'
  }
  if (reason === 'plan_required') return 'Esta herramienta es solo para Kompvid Pro.'
  if (reason === 'tool_unavailable') return 'Esta herramienta no esta disponible por ahora.'
  return 'No se pudo autorizar el uso de esta herramienta.'
}

function detectKind(file: File): MediaKind | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (IMAGE_TYPES.includes(file.type) || IMAGE_EXT.includes(ext)) return 'image'
  if (file.type.startsWith('video/') || VIDEO_EXT.includes(ext)) return 'video'
  if (file.type.startsWith('audio/') || AUDIO_EXT.includes(ext)) return 'audio'
  return null
}

function waitEvent(el: EventTarget, ok: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), 10000)
    el.addEventListener(ok, () => { window.clearTimeout(timer); resolve() }, { once: true })
    el.addEventListener('error', () => { window.clearTimeout(timer); reject(new Error('error')) }, { once: true })
  })
}

async function probe(file: File, kind: MediaKind): Promise<MediaItem> {
  const url = URL.createObjectURL(file)
  try {
    if (kind === 'image') {
      const img = new Image()
      const p = waitEvent(img, 'load')
      img.src = url
      await p
      if (!img.naturalWidth) throw new Error('empty')
      return { id: uid(), kind, file, name: file.name, duration: IMAGE_SECONDS, url, width: img.naturalWidth, height: img.naturalHeight }
    }
    const el = document.createElement(kind === 'video' ? 'video' : 'audio')
    el.preload = 'metadata'
    const p = waitEvent(el, 'loadedmetadata')
    el.src = url
    await p
    let duration = el.duration
    if (duration === Infinity) {
      const seek = waitEvent(el, 'timeupdate')
      el.currentTime = 1e101
      await seek
      duration = el.duration
      el.currentTime = 0
    }
    const width = kind === 'video' ? (el as HTMLVideoElement).videoWidth : 0
    const height = kind === 'video' ? (el as HTMLVideoElement).videoHeight : 0
    el.removeAttribute('src')
    el.load()
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('duration')
    if (kind === 'video' && !width) throw new Error('size')
    return { id: uid(), kind, file, name: file.name, duration, url, width, height }
  } catch (err) {
    URL.revokeObjectURL(url)
    throw err
  }
}

function NumField(props: { label: string; value: number; step?: number; onCommit: (n: number) => void }) {
  const shown = Number(props.value.toFixed(2))
  return (
    <label>
      {props.label}
      <input
        key={shown}
        type="number"
        step={props.step ?? 0.1}
        defaultValue={shown}
        onBlur={(e) => {
          const n = Number(e.target.value)
          if (e.target.value !== '' && Number.isFinite(n) && n !== shown) props.onCommit(n)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
    </label>
  )
}

export default function VideoEditorPage() {
  const { plan } = usePlan()
  const isPro = plan === 'pro'
  const [remote, setRemote] = useState<EditorLimits | null>(null)
  const limits: EditorLimits = { ...(isPro ? LIMITS.pro : LIMITS.free), maxProjects: isPro ? 50 : 3, ...(remote ?? {}) }
  useEffect(() => {
    let on = true
    void loadEditorLimits().then((r) => {
      const row = r.rows.find((x) => x.plan === (isPro ? 'pro' : 'free'))
      if (on && row) setRemote(rowToLimits(row))
    })
    return () => {
      on = false
    }
  }, [isPro])
  const maxFileMB = isPro ? PRO_FILE_CAP_MB : PLANS.free.maxFileMB

  const [hist, setHist] = useState<Hist>({ past: [], present: EMPTY_PROJECT, future: [] })
  const [name, setName] = useState('Proyecto sin titulo')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [sel, setSel] = useState<Sel>(null)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [zoom, setZoom] = useState(30)
  const [dragging, setDragging] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [shortSide, setShortSide] = useState(720)
  const [expStage, setExpStage] = useState<'idle' | 'preparing' | 'working'>('idle')
  const [progress, setProgress] = useState(0)
  const [expError, setExpError] = useState<string | null>(null)
  const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [dropAt, setDropAt] = useState<number | null>(null)
  const [recMode, setRecMode] = useState<'camera' | 'screen' | 'mic' | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const thumbReq = useRef(new Set<string>())
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    document.body.classList.add('ed-fullscreen')
    return () => {
      document.body.classList.remove('ed-fullscreen')
      if (recRef.current) {
        recRef.current.onstop = null
        try { recRef.current.stop() } catch { /* ya detenido */ }
      }
      streamRef.current?.getTracks().forEach((tr) => tr.stop())
    }
  }, [])
  const dragKind = useRef<MediaKind>('video')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { return localStorage.getItem('kompvid-ed-theme') === 'dark' ? 'dark' : 'light' } catch { return 'light' }
  })
  const [saveState, setSaveState] = useState<'idle' | 'saving'>('idle')
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectRow[] | null>(null)
  const [pendingRef, setPendingRef] = useState<MediaRef[]>([])

  const project = hist.present
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioEls = useRef(new Map<string, HTMLAudioElement>())
  const mediaRef = useRef<MediaItem[]>([])
  const resultUrlRef = useRef<string | null>(null)
  const runRef = useRef(0)

  const mediaMap = useMemo(() => new Map(media.map((m) => [m.id, m])), [media])
  const starts = useMemo(() => videoStarts(project.vclips), [project.vclips])
  const total = totalDuration(project)
  const exporting = expStage !== 'idle'

  const commit = useCallback((fn: (p: Project) => Project) => {
    setHist((h) => {
      const next = fn(h.present)
      if (next === h.present) return h
      return { past: [...h.past.slice(-99), h.present], present: next, future: [] }
    })
  }, [])

  function undo() {
    setHist((h) => (h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h))
  }
  function redo() {
    setHist((h) => (h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h))
  }

  useEffect(() => {
    mediaRef.current = media
  }, [media])

  useEffect(() => {
    const els = audioEls.current
    return () => {
      runRef.current += 1
      cancelCompression()
      mediaRef.current.forEach((m) => URL.revokeObjectURL(m.url))
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
      els.forEach((a) => a.pause())
      els.clear()
    }
  }, [])

  // Reproduccion: reloj propio, el video y el audio se sincronizan en el efecto de abajo.
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setT((prev) => prev + dt)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  useEffect(() => {
    if (playing && t >= total) {
      setPlaying(false)
      setT(total)
    }
  }, [t, playing, total])

  const active = useMemo(() => {
    for (let i = 0; i < project.vclips.length; i++) {
      const c = project.vclips[i]
      const d = clipDuration(c)
      if (t >= starts[i] && t < starts[i] + d) return { clip: c, local: c.inSec + (t - starts[i]) }
    }
    return null
  }, [project.vclips, starts, t])

  const activeMedia = active ? mediaMap.get(active.clip.mediaId) : undefined

  useEffect(() => {
    const v = videoRef.current
    if (v) {
      if (active && activeMedia && activeMedia.kind === 'video') {
        if (v.dataset.mid !== activeMedia.id) {
          v.dataset.mid = activeMedia.id
          v.src = activeMedia.url
        }
        if (!playing || Math.abs(v.currentTime - active.local) > 0.3) {
          try { v.currentTime = active.local } catch { /* aun sin metadatos */ }
        }
        if (playing && v.paused) void v.play().catch(() => undefined)
        if (!playing && !v.paused) v.pause()
      } else if (!v.paused) {
        v.pause()
      }
    }

    const ids = new Set(project.aclips.map((a) => a.id))
    audioEls.current.forEach((el, id) => {
      if (!ids.has(id)) {
        el.pause()
        audioEls.current.delete(id)
      }
    })
    for (const a of project.aclips) {
      const m = mediaMap.get(a.mediaId)
      if (!m) continue
      let el = audioEls.current.get(a.id)
      if (!el) {
        el = new Audio(m.url)
        audioEls.current.set(a.id, el)
      }
      const on = playing && t >= a.start && t < a.start + clipDuration(a)
      el.volume = Math.min(1, Math.max(0, a.volume))
      const target = a.inSec + (t - a.start)
      if (on) {
        if (el.paused) {
          el.currentTime = target
          void el.play().catch(() => undefined)
        } else if (Math.abs(el.currentTime - target) > 0.3) {
          el.currentTime = target
        }
      } else if (!el.paused) {
        el.pause()
      }
    }
  }, [t, playing, active, activeMedia, project.aclips, mediaMap])

  async function handleFiles(files: FileList | File[]) {
    setImportError(null)
    setNotice(null)
    for (const file of Array.from(files)) {
      if (mediaRef.current.length >= limits.maxMedia) {
        setImportError('Tu plan permite hasta ' + limits.maxMedia + ' archivos en el proyecto.')
        return
      }
      const kind = detectKind(file)
      if (!kind) {
        setImportError('Formato no compatible: ' + file.name + '. Usa video MP4, WebM o MOV, imagen JPG, PNG o WebP, o audio MP3, WAV, M4A, OGG o FLAC.')
        continue
      }
      if (file.size === 0) {
        setImportError('El archivo esta vacio: ' + file.name)
        continue
      }
      if (file.size > maxFileMB * 1024 * 1024) {
        setImportError('"' + file.name + '" supera el limite de ' + maxFileMB + ' MB de tu plan.')
        continue
      }
      try {
        let item = await probe(file, kind)
        const ref = pendingRef.find((r) => r.name === file.name && r.size === file.size && r.kind === kind && !mediaRef.current.some((m) => m.id === r.id))
        if (ref) {
          item = { ...item, id: ref.id }
          setPendingRef((prev) => prev.filter((r) => r.id !== ref.id))
        }
        mediaRef.current = [...mediaRef.current, item]
        setMedia((prev) => [...prev, item])
      } catch {
        setImportError('Tu navegador no pudo leer "' + file.name + '". Puede estar danado o usar un formato que no admite.')
      }
    }
  }

  function handleInput(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files) void handleFiles(files)
    e.target.value = ''
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragging(false)
    void handleFiles(e.dataTransfer.files)
  }

  function removeMedia(id: string) {
    const m = mediaMap.get(id)
    if (!m) return
    setPlaying(false)
    commit((p) => ({
      ...p,
      vclips: p.vclips.filter((c) => c.mediaId !== id),
      aclips: p.aclips.filter((c) => c.mediaId !== id),
    }))
    URL.revokeObjectURL(m.url)
    setMedia((prev) => prev.filter((x) => x.id !== id))
    setSel(null)
  }

  function addToTimeline(m: MediaItem, atSec?: number) {
    setNotice(null)
    if (m.kind === 'audio') {
      if (project.aclips.length >= limits.maxAClips) {
        setNotice('Tu plan permite hasta ' + limits.maxAClips + ' clips de audio.')
        return
      }
      const clip: AClip = { id: uid(), mediaId: m.id, start: Math.max(0, atSec ?? Math.min(t, total)), inSec: 0, outSec: m.duration, volume: 1 }
      commit((p) => ({ ...p, aclips: [...p.aclips, clip] }))
      setSel({ kind: 'a', id: clip.id })
      return
    }
    if (project.vclips.length >= limits.maxVClips) {
      setNotice('Tu plan permite hasta ' + limits.maxVClips + ' clips de video.')
      return
    }
    if (total + m.duration > limits.maxSeconds) {
      setNotice('Tu plan permite proyectos de hasta ' + limits.maxSeconds + ' segundos.')
      return
    }
    const clip: VClip = { id: uid(), mediaId: m.id, inSec: 0, outSec: m.duration }
    commit((p) => {
      const st = videoStarts(p.vclips)
      let at = p.vclips.length
      if (atSec !== undefined) {
        for (let k = 0; k < p.vclips.length; k++) {
          if (atSec < st[k] + clipDuration(p.vclips[k]) / 2) { at = k; break }
        }
      }
      return { ...p, vclips: [...p.vclips.slice(0, at), clip, ...p.vclips.slice(at)] }
    })
    setSel({ kind: 'v', id: clip.id })
  }

  function addText() {
    setNotice(null)
    if (project.texts.length >= limits.maxTexts) {
      setNotice('Tu plan permite hasta ' + limits.maxTexts + ' textos.')
      return
    }
    const tc: TextClip = { id: uid(), text: 'Texto', start: Math.min(t, total), duration: 3, size: 8, color: '#ffffff', bg: true, x: 50, y: 85 }
    commit((p) => ({ ...p, texts: [...p.texts, tc] }))
    setSel({ kind: 't', id: tc.id })
  }

  function patchV(id: string, patch: Partial<VClip>) {
    commit((p) => ({
      ...p,
      vclips: p.vclips.map((c) => {
        if (c.id !== id) return c
        const m = mediaMap.get(c.mediaId)
        const inSec = Math.max(0, patch.inSec ?? c.inSec)
        let outSec = patch.outSec ?? c.outSec
        if (m && m.kind === 'video') outSec = Math.min(outSec, m.duration)
        if (outSec < inSec + 0.1) return c
        if (total - clipDuration(c) + (outSec - inSec) > limits.maxSeconds) return c
        return { ...c, inSec, outSec }
      }),
    }))
  }

  function patchA(id: string, patch: Partial<AClip>) {
    commit((p) => ({
      ...p,
      aclips: p.aclips.map((c) => {
        if (c.id !== id) return c
        const m = mediaMap.get(c.mediaId)
        const inSec = Math.max(0, patch.inSec ?? c.inSec)
        let outSec = patch.outSec ?? c.outSec
        if (m) outSec = Math.min(outSec, m.duration)
        if (outSec < inSec + 0.1) return c
        return {
          ...c,
          inSec,
          outSec,
          start: Math.max(0, patch.start ?? c.start),
          volume: Math.min(1, Math.max(0, patch.volume ?? c.volume)),
        }
      }),
    }))
  }

  function patchT(id: string, patch: Partial<TextClip>) {
    commit((p) => ({
      ...p,
      texts: p.texts.map((c) => {
        if (c.id !== id) return c
        const next = { ...c, ...patch }
        next.start = Math.max(0, next.start)
        next.duration = Math.max(0.2, next.duration)
        next.size = Math.min(30, Math.max(2, next.size))
        next.x = Math.min(100, Math.max(0, next.x))
        next.y = Math.min(100, Math.max(0, next.y))
        return next
      }),
    }))
  }

  function splitSel() {
    if (!sel) return
    setNotice(null)
    const margin = 0.1
    if (sel.kind === 'v') {
      const i = project.vclips.findIndex((c) => c.id === sel.id)
      if (i < 0) return
      const c = project.vclips[i]
      const s = starts[i]
      const d = clipDuration(c)
      if (t <= s + margin || t >= s + d - margin) {
        setNotice('Coloca el cursor dentro del clip para dividirlo.')
        return
      }
      const cut = c.inSec + (t - s)
      const second: VClip = { id: uid(), mediaId: c.mediaId, inSec: cut, outSec: c.outSec }
      commit((p) => ({ ...p, vclips: [...p.vclips.slice(0, i), { ...c, outSec: cut }, second, ...p.vclips.slice(i + 1)] }))
      setSel({ kind: 'v', id: second.id })
    } else if (sel.kind === 'a') {
      const c = project.aclips.find((x) => x.id === sel.id)
      if (!c) return
      const d = clipDuration(c)
      if (t <= c.start + margin || t >= c.start + d - margin) {
        setNotice('Coloca el cursor dentro del clip para dividirlo.')
        return
      }
      const cut = c.inSec + (t - c.start)
      const second: AClip = { ...c, id: uid(), start: t, inSec: cut }
      commit((p) => ({ ...p, aclips: p.aclips.flatMap((x) => (x.id === c.id ? [{ ...c, outSec: cut }, second] : [x])) }))
      setSel({ kind: 'a', id: second.id })
    } else {
      const c = project.texts.find((x) => x.id === sel.id)
      if (!c) return
      if (t <= c.start + margin || t >= c.start + c.duration - margin) {
        setNotice('Coloca el cursor dentro del texto para dividirlo.')
        return
      }
      const second: TextClip = { ...c, id: uid(), start: t, duration: c.start + c.duration - t }
      commit((p) => ({ ...p, texts: p.texts.flatMap((x) => (x.id === c.id ? [{ ...c, duration: t - c.start }, second] : [x])) }))
      setSel({ kind: 't', id: second.id })
    }
  }

  function deleteSel() {
    if (!sel) return
    setPlaying(false)
    if (sel.kind === 'v') commit((p) => ({ ...p, vclips: p.vclips.filter((c) => c.id !== sel.id) }))
    else if (sel.kind === 'a') commit((p) => ({ ...p, aclips: p.aclips.filter((c) => c.id !== sel.id) }))
    else commit((p) => ({ ...p, texts: p.texts.filter((c) => c.id !== sel.id) }))
    setSel(null)
  }

  function moveSel(dir: -1 | 1) {
    if (!sel) return
    if (sel.kind === 'v') {
      const i = project.vclips.findIndex((c) => c.id === sel.id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= project.vclips.length) return
      commit((p) => {
        const arr = [...p.vclips]
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
        return { ...p, vclips: arr }
      })
    } else if (sel.kind === 'a') {
      const c = project.aclips.find((x) => x.id === sel.id)
      if (c) patchA(c.id, { start: c.start + dir * 0.5 })
    } else {
      const c = project.texts.find((x) => x.id === sel.id)
      if (c) patchT(c.id, { start: c.start + dir * 0.5 })
    }
  }

  function seekFromRuler(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    setT(Math.min(Math.max(0, (e.clientX - rect.left) / zoom), total))
  }

  function beginDrag(x0: number, y0: number, onMove: (dx: number, dy: number) => void) {
    setPlaying(false)
    setHist((h) => ({ past: [...h.past.slice(-99), h.present], present: h.present, future: [] }))
    const move = (ev: PointerEvent) => onMove(ev.clientX - x0, ev.clientY - y0)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  function startDrag(e: React.PointerEvent<HTMLButtonElement>, kind: 'v' | 't' | 'a', id: string) {
    if (exporting) return
    e.preventDefault()
    setSel({ kind, id })
    const rect = e.currentTarget.getBoundingClientRect()
    const zone = Math.min(8, rect.width / 3)
    const mode: 'move' | 'left' | 'right' = e.clientX - rect.left < zone ? 'left' : rect.right - e.clientX < zone ? 'right' : 'move'
    const base = project
    const bs = videoStarts(base.vclips)
    const baseTotal = totalDuration(base)
    const apply = (dt: number): Project => {
      if (kind === 'v') {
        const i = base.vclips.findIndex((x) => x.id === id)
        if (i < 0) return base
        const c = base.vclips[i]
        const m = mediaMap.get(c.mediaId)
        const d = clipDuration(c)
        if (mode === 'move') {
          const center = bs[i] + dt + d / 2
          const others = base.vclips.filter((x) => x.id !== id)
          let acc = 0
          let at = others.length
          for (let k = 0; k < others.length; k++) {
            const od = clipDuration(others[k])
            if (center < acc + od / 2) { at = k; break }
            acc += od
          }
          const arr = [...others]
          arr.splice(at, 0, c)
          return { ...base, vclips: arr }
        }
        let inSec = c.inSec
        let outSec = c.outSec
        if (m?.kind === 'image') {
          outSec = c.inSec + Math.max(0.1, d + (mode === 'left' ? -dt : dt))
        } else if (mode === 'left') {
          inSec = Math.min(Math.max(0, c.inSec + dt), c.outSec - 0.1)
        } else {
          outSec = Math.min(m ? m.duration : c.outSec, Math.max(c.inSec + 0.1, c.outSec + dt))
        }
        if (outSec - inSec > d && baseTotal - d + (outSec - inSec) > limits.maxSeconds) return base
        return { ...base, vclips: base.vclips.map((x) => (x.id === id ? { ...x, inSec, outSec } : x)) }
      }
      if (kind === 't') {
        const c = base.texts.find((x) => x.id === id)
        if (!c) return base
        let start = c.start
        let duration = c.duration
        if (mode === 'move') start = Math.max(0, c.start + dt)
        else if (mode === 'right') duration = Math.max(0.2, c.duration + dt)
        else {
          const end = c.start + c.duration
          const ns = Math.min(Math.max(0, c.start + dt), end - 0.2)
          start = ns
          duration = end - ns
        }
        return { ...base, texts: base.texts.map((x) => (x.id === id ? { ...x, start, duration } : x)) }
      }
      const c = base.aclips.find((x) => x.id === id)
      if (!c) return base
      const m = mediaMap.get(c.mediaId)
      let { start, inSec, outSec } = c
      if (mode === 'move') start = Math.max(0, c.start + dt)
      else if (mode === 'right') outSec = Math.min(m ? m.duration : c.outSec, Math.max(c.inSec + 0.1, c.outSec + dt))
      else {
        const delta = Math.min(Math.max(dt, -Math.min(c.inSec, c.start)), c.outSec - c.inSec - 0.1)
        inSec = c.inSec + delta
        start = c.start + delta
      }
      return { ...base, aclips: base.aclips.map((x) => (x.id === id ? { ...x, start, inSec, outSec } : x)) }
    }
    beginDrag(e.clientX, e.clientY, (dx) => {
      const next = apply(dx / zoom)
      setHist((h) => ({ ...h, present: next }))
    })
  }

  function startTextDrag(e: React.PointerEvent<HTMLDivElement>, id: string) {
    if (exporting) return
    e.preventDefault()
    setSel({ kind: 't', id })
    const box = e.currentTarget.getBoundingClientRect()
    const cv = e.currentTarget.parentElement?.getBoundingClientRect()
    const base = project
    const c = base.texts.find((x) => x.id === id)
    if (!cv || !c) return
    const rx = Math.max(1, cv.width - box.width)
    const ry = Math.max(1, cv.height - box.height)
    beginDrag(e.clientX, e.clientY, (dx, dy) => {
      const nx = Math.min(100, Math.max(0, c.x + (dx / rx) * 100))
      const ny = Math.min(100, Math.max(0, c.y + (dy / ry) * 100))
      const next = { ...base, texts: base.texts.map((x) => (x.id === id ? { ...x, x: nx, y: ny } : x)) }
      setHist((h) => ({ ...h, present: next }))
    })
  }

  function thumbStyle(mid: string): React.CSSProperties {
    const m = mediaMap.get(mid)
    const u = m?.kind === 'image' ? m.url : thumbs[mid]
    return u ? { backgroundImage: 'url(' + u + ')' } : {}
  }

  function startTextDown(e: React.PointerEvent<HTMLDivElement>, id: string) {
    const r = e.currentTarget.getBoundingClientRect()
    const lx = e.clientX - r.left
    const ly = e.clientY - r.top
    const z = 14
    const sx = lx < z ? -1 : r.width - lx < z ? 1 : 0
    const sy = ly < z ? -1 : r.height - ly < z ? 1 : 0
    const c = project.texts.find((x) => x.id === id)
    const cvH = e.currentTarget.parentElement?.getBoundingClientRect().height
    if (exporting || sel?.id !== id || sx === 0 || sy === 0 || !c || !cvH) { startTextDrag(e, id); return }
    e.preventDefault()
    const base = project
    beginDrag(e.clientX, e.clientY, (dx, dy) => {
      const size = Math.min(30, Math.max(2, c.size + (((sx * dx + sy * dy) / 2) / cvH) * 100))
      const next = { ...base, texts: base.texts.map((x) => (x.id === id ? { ...x, size } : x)) }
      setHist((h) => ({ ...h, present: next }))
    })
  }

  function startScrub(e: React.PointerEvent<HTMLDivElement>) {
    setPlaying(false)
    const rect = e.currentTarget.getBoundingClientRect()
    const seek = (x: number) => setT(Math.min(Math.max(0, (x - rect.left) / zoom), total))
    seek(e.clientX)
    const move = (ev: PointerEvent) => seek(ev.clientX)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  async function startRec(mode: 'camera' | 'screen' | 'mic') {
    if (recMode || exporting) return
    setNotice(null)
    try {
      if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') throw new Error('unsupported')
      const stream =
        mode === 'screen'
          ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
          : await navigator.mediaDevices.getUserMedia(mode === 'camera' ? { video: true, audio: true } : { audio: true })
      const wanted = mode === 'mic' ? ['audio/webm;codecs=opus', 'audio/webm'] : ['video/webm;codecs=vp8,opus', 'video/webm']
      const mt = wanted.find((x) => MediaRecorder.isTypeSupported(x))
      const rec = new MediaRecorder(stream, mt ? { mimeType: mt } : undefined)
      const chunks: Blob[] = []
      rec.ondataavailable = (ev) => { if (ev.data.size > 0) chunks.push(ev.data) }
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop())
        streamRef.current = null
        recRef.current = null
        setRecMode(null)
        if (chunks.length === 0) return
        const type = mode === 'mic' ? 'audio/webm' : 'video/webm'
        const label = mode === 'mic' ? 'voz-' : mode === 'screen' ? 'pantalla-' : 'camara-'
        const file = new File([new Blob(chunks, { type })], label + Date.now() + (mode === 'mic' ? '.weba' : '.webm'), { type })
        void handleFiles([file])
      }
      stream.getVideoTracks()[0]?.addEventListener('ended', () => { if (rec.state !== 'inactive') rec.stop() })
      streamRef.current = stream
      recRef.current = rec
      rec.start(1000)
      setRecMode(mode)
    } catch {
      setNotice('No se pudo iniciar la grabacion. Revisa los permisos del navegador.')
    }
  }

  function stopRec() {
    const r = recRef.current
    if (r && r.state !== 'inactive') r.stop()
  }

  function patchFx(id: string, patch: Partial<VClip>) {
    commit((p) => ({ ...p, vclips: p.vclips.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
  }

  function zoomTo(next: number) {
    const z = Math.min(240, Math.max(5, next))
    const el = scrollRef.current
    const screenX = el ? t * zoom - el.scrollLeft : 0
    setZoom(z)
    if (el) requestAnimationFrame(() => { el.scrollLeft = Math.max(0, t * z - screenX) })
  }

  function fitZoom() {
    const el = scrollRef.current
    if (!el) return
    zoomTo((el.clientWidth - 90 - 24) / Math.max(total, 5))
    requestAnimationFrame(() => { el.scrollLeft = 0 })
  }

  function splitAtCursor() {
    if (sel) { splitSel(); return }
    if (!active) { setNotice('Coloca el cursor sobre un clip de video.'); return }
    const i = project.vclips.findIndex((x) => x.id === active.clip.id)
    if (i < 0) return
    const c = project.vclips[i]
    const s = starts[i]
    if (t <= s + 0.1 || t >= s + clipDuration(c) - 0.1) { setNotice('Coloca el cursor dentro del clip para dividirlo.'); return }
    const cut = c.inSec + (t - s)
    const second: VClip = { id: uid(), mediaId: c.mediaId, inSec: cut, outSec: c.outSec }
    commit((p) => ({ ...p, vclips: [...p.vclips.slice(0, i), { ...c, outSec: cut }, second, ...p.vclips.slice(i + 1)] }))
    setSel({ kind: 'v', id: second.id })
  }

  function togglePlay() {
    if (total <= 0) return
    if (!playing && t >= total) setT(0)
    setPlaying((p) => !p)
  }

  function releaseResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
    resultUrlRef.current = null
    setResult(null)
  }

  async function handleExport() {
    if (exporting || project.vclips.length === 0) return
    setPlaying(false)
    setExpError(null)
    releaseResult()
    if (total > limits.maxSeconds) {
      setExpError('Tu plan permite exportar hasta ' + limits.maxSeconds + ' segundos.')
      return
    }
    runRef.current += 1
    const run = runRef.current
    setExpStage('preparing')
    setProgress(0)
    try {
      await loadEngine()
      if (run !== runRef.current) return
      const usage = await consumeUsage('video-editor')
      if (run !== runRef.current) return
      if (usage.error || !usage.result) {
        setExpError(usage.error ?? 'No se pudo verificar tu limite de uso.')
        setExpStage('idle')
        return
      }
      if (!usage.result.allowed) {
        setExpError(usageMessage(usage.result.reason, usage.result.limit))
        setExpStage('idle')
        return
      }
      setExpStage('working')
      const blob = await exportProject(project, mediaMap, { shortSide: Math.min(shortSide, limits.maxShortSide), crf: 23 }, setProgress)
      if (run !== runRef.current) return
      const url = URL.createObjectURL(blob)
      resultUrlRef.current = url
      const safe = (name.trim() || 'proyecto').replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'proyecto'
      setResult({ url, size: blob.size, name: safe + '-kompvid.mp4' })
      setExpStage('idle')
    } catch (err) {
      console.error('Kompvid Studio exportar:', err)
      if (run !== runRef.current) return
      setExpError(
        'No se pudo exportar. Si tus videos no tienen audio, desmarca "Conservar audio de los videos". Detalle tecnico: ' +
          (err instanceof Error ? err.message : String(err)),
      )
      setExpStage('idle')
    }
  }

  function cancelExport() {
    runRef.current += 1
    cancelCompression()
    setProgress(0)
    setExpStage('idle')
    setNotice('Exportacion cancelada.')
  }

  useEffect(() => {
    let on = true
    void listProjects().then((r) => {
      if (on && !r.error) setProjects(r.rows)
    })
    return () => {
      on = false
    }
  }, [])

  async function refreshProjects(): Promise<ProjectRow[] | null> {
    const r = await listProjects()
    if (r.error) {
      setSaveMsg(r.error)
      return null
    }
    setProjects(r.rows)
    return r.rows
  }

  async function handleSave(asNew: boolean) {
    if (saveState === 'saving' || exporting) return
    setSaveMsg(null)
    setSaveState('saving')
    const id = asNew ? null : projectId
    const maxProjects = limits.maxProjects
    if (!id) {
      const rows = await refreshProjects()
      if (!rows) {
        setSaveState('idle')
        return
      }
      if (rows.length >= maxProjects) {
        setSaveMsg('Tu plan permite hasta ' + maxProjects + ' proyectos guardados. Elimina uno para guardar otro.')
        setSaveState('idle')
        return
      }
    }
    const refs: MediaRef[] = media.map((m) => ({ id: m.id, name: m.name, size: m.file.size, kind: m.kind }))
    const r = await saveProject(id, name.trim().slice(0, 80) || 'Proyecto sin titulo', { project, media: refs })
    if (r.error || !r.id) {
      setSaveMsg(r.error ?? 'No se pudo guardar el proyecto.')
    } else {
      setProjectId(r.id)
      setSaveMsg('Proyecto guardado.')
      void refreshProjects()
    }
    setSaveState('idle')
  }

  async function handleOpen(id: string) {
    if (!id || exporting) return
    setSaveMsg(null)
    setPlaying(false)
    const r = await loadProject(id)
    if (r.error || !r.row) {
      setSaveMsg(r.error ?? 'No se pudo abrir el proyecto.')
      return
    }
    const remap = new Map<string, string>()
    const pending: MediaRef[] = []
    for (const ref of r.row.data.media) {
      const ex = mediaRef.current.find((m) => m.name === ref.name && m.file.size === ref.size && m.kind === ref.kind)
      if (ex) remap.set(ref.id, ex.id)
      else pending.push(ref)
    }
    const fix = (mid: string) => remap.get(mid) ?? mid
    const p = r.row.data.project
    const next: Project = {
      ...EMPTY_PROJECT,
      ...p,
      vclips: p.vclips.map((c) => ({ ...c, mediaId: fix(c.mediaId) })),
      aclips: p.aclips.map((c) => ({ ...c, mediaId: fix(c.mediaId) })),
    }
    setHist({ past: [], present: next, future: [] })
    setName(r.row.name)
    setProjectId(r.row.id)
    setPendingRef(pending)
    setSel(null)
    setT(0)
    setSaveMsg(pending.length > 0 ? 'Proyecto abierto. Importa de nuevo: ' + pending.map((x) => x.name).join(', ') : 'Proyecto abierto.')
  }

  async function handleDelete() {
    if (!projectId || !window.confirm('Eliminar este proyecto guardado? No se puede deshacer.')) return
    const r = await deleteProject(projectId)
    if (r.error) {
      setSaveMsg(r.error)
      return
    }
    setProjectId(null)
    setSaveMsg('Proyecto eliminado.')
    void refreshProjects()
  }

  useEffect(() => {
    media.forEach((m) => {
      if (m.kind !== 'video' || thumbReq.current.has(m.id)) return
      thumbReq.current.add(m.id)
      const v = document.createElement('video')
      v.muted = true
      v.preload = 'auto'
      v.src = m.url
      const done = () => { v.removeAttribute('src'); v.load() }
      v.addEventListener('loadeddata', () => { try { v.currentTime = Math.min(0.5, m.duration / 2) } catch { done() } }, { once: true })
      v.addEventListener('seeked', () => {
        try {
          const cv = document.createElement('canvas')
          cv.width = 160
          cv.height = Math.max(2, Math.round((160 * (m.height || 9)) / (m.width || 16)))
          const cx = cv.getContext('2d')
          if (cx) {
            cx.drawImage(v, 0, 0, cv.width, cv.height)
            setThumbs((p) => ({ ...p, [m.id]: cv.toDataURL('image/jpeg', 0.6) }))
          }
        } catch { /* sin miniatura */ }
        done()
      }, { once: true })
      v.addEventListener('error', done, { once: true })
    })
  }, [media])

  const fxClip = active?.clip
  const fxPos = fxClip && active ? active.local - fxClip.inSec : 0
  const fxDur = fxClip ? clipDuration(fxClip) : 0
  let fxOp = 1
  if (fxClip && fxClip.fadeIn && fxPos < fxClip.fadeIn) fxOp = Math.min(fxOp, fxPos / fxClip.fadeIn)
  if (fxClip && fxClip.fadeOut && fxDur - fxPos < fxClip.fadeOut) fxOp = Math.min(fxOp, (fxDur - fxPos) / fxClip.fadeOut)
  const previewFx: React.CSSProperties = fxClip
    ? {
        filter: 'brightness(' + (1 + (fxClip.bright ?? 0) / 100) + ') contrast(' + (fxClip.contrast ?? 100) / 100 + ') saturate(' + (fxClip.sat ?? 100) / 100 + ')',
        opacity: Math.max(0, Math.min(1, fxOp)),
      }
    : {}

  const format = CANVAS_FORMATS.find((f) => f.id === project.format) ?? CANVAS_FORMATS[0]
  const lastText = project.texts.reduce((m, c) => Math.max(m, c.start + c.duration), 0)
  const lastAudio = project.aclips.reduce((m, c) => Math.max(m, c.start + clipDuration(c)), 0)
  const span = Math.max(30, Math.ceil(Math.max(total, lastText, lastAudio) + 10))
  const tickEvery = [1, 2, 5, 10, 15, 30, 60, 120, 300].find((s) => s * zoom >= 70) ?? 600
  const snapDrop = (x: number): number => {
    if (dragKind.current === 'audio') return x
    let acc = 0
    for (const c of project.vclips) {
      const d = clipDuration(c)
      if (x < acc + d / 2) return acc
      acc += d
    }
    return acc
  }
  const dropShow: number | null = dropAt === null ? null : snapDrop(dropAt)
  const ticks: number[] = []
  for (let s = 0; s <= span; s += tickEvery) ticks.push(s)

  const selV = sel?.kind === 'v' ? project.vclips.find((c) => c.id === sel.id) : undefined
  const selA = sel?.kind === 'a' ? project.aclips.find((c) => c.id === sel.id) : undefined
  const selT = sel?.kind === 't' ? project.texts.find((c) => c.id === sel.id) : undefined
  const selVMedia = selV ? mediaMap.get(selV.mediaId) : undefined
  const resolutions = [480, 720, 1080].filter((s) => s <= limits.maxShortSide)
  const liveTexts = project.texts.filter((c) => t >= c.start && t < c.start + c.duration)

  return (
    <section className="wrap tool-page ed" data-theme={theme}>
      <h1 className="page-title">Editor de video - Kompvid Studio</h1>

      <div className="ed-top">
        <Link
          to="/"
          className="ed-btn ed-btn-small ed-exit"
          onClick={(e) => { if (exporting && !window.confirm('Hay una exportacion en curso. Salir la cancelara.')) e.preventDefault() }}
        >
          Salir del editor
        </Link>
        <button type="button" className="ed-btn ed-btn-primary ed-btn-small" onClick={handleExport} disabled={exporting || project.vclips.length === 0} title="Agrega al menos un clip para exportar">Exportar</button>
        <select value={shortSide} onChange={(e) => setShortSide(Number(e.target.value))} disabled={exporting} aria-label="Resolucion de exportacion">
          {resolutions.map((s) => (
            <option key={s} value={s}>{s}p</option>
          ))}
        </select>
        {exporting && <button type="button" className="ed-btn ed-btn-small" onClick={cancelExport}>Cancelar</button>}        <input type="text" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre del proyecto" maxLength={80} />
        <select
          value={project.format}
          onChange={(e) => commit((p) => ({ ...p, format: e.target.value as CanvasFormatId }))}
          aria-label="Formato del video"
        >
          {CANVAS_FORMATS.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
        <select
          value=""
          onChange={(e) => {
            const preset = FORMAT_PRESETS.find((p) => p.id === e.target.value)
            if (preset) commit((p) => ({ ...p, format: preset.format }))
          }}
          aria-label="Preset para redes sociales"
        >
          <option value="">Preset de red social</option>
          {FORMAT_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <select
          value={project.fit}
          onChange={(e) => commit((p) => ({ ...p, fit: e.target.value as 'fit' | 'fill' }))}
          aria-label="Ajuste del video al lienzo"
        >
          <option value="fit">Ajustar (barras negras)</option>
          <option value="fill">Rellenar (recortar bordes)</option>
        </select>
        <span className="ed-top-spacer" />
        <button type="button" className="ed-btn" onClick={() => void handleSave(false)} disabled={saveState === 'saving' || exporting}>
          {saveState === 'saving' ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" className="ed-btn" onClick={() => void handleSave(true)} disabled={saveState === 'saving' || exporting}>Guardar como nuevo</button>
        <select value="" onChange={(e) => void handleOpen(e.target.value)} aria-label="Abrir proyecto guardado">
          <option value="">Abrir proyecto</option>
          {(projects ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {projectId && <button type="button" className="ed-btn" onClick={() => void handleDelete()}>Eliminar proyecto</button>}
        {saveMsg && <span className="ed-save" role="status">{saveMsg}</span>}
        <button
          type="button"
          className="ed-btn ed-btn-small"
          aria-pressed={theme === 'dark'}
          title="Cambiar tema"
          onClick={() => {
            const n = theme === 'light' ? 'dark' : 'light'
            setTheme(n)
            try { localStorage.setItem('kompvid-ed-theme', n) } catch { /* sin almacenamiento */ }
          }}
        >
          {theme === 'light' ? 'Tema oscuro' : 'Tema claro'}
        </button>
        <button type="button" className="ed-btn" onClick={undo} disabled={hist.past.length === 0 || exporting}>Deshacer</button>
        <button type="button" className="ed-btn" onClick={redo} disabled={hist.future.length === 0 || exporting}>Rehacer</button>
      </div>

      <div className="ed-main">
        <aside className="ed-side" aria-label="Recursos del proyecto">
          <h2>Mi multimedia</h2>
          <label
            className={dragging ? 'ed-drop is-active' : 'ed-drop'}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <input className="sr-only" type="file" multiple accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/webp,audio/*,.mp4,.webm,.mov,.m4v,.jpg,.jpeg,.png,.webp,.mp3,.wav,.m4a,.aac,.ogg,.flac" onChange={handleInput} />
            Arrastra archivos aqui o haz clic para importar
          </label>
          {importError && <p className="ed-error" role="alert">{importError}</p>}
          {media.length === 0 && <p className="ed-empty">Aun no hay archivos importados.</p>}
          {media.map((m) => (
            <div key={m.id} className="ed-media" draggable onDragStart={(e) => { e.dataTransfer.setData("text/kompvid-media", m.id); dragKind.current = m.kind }} onDragEnd={() => setDropAt(null)}>
              <strong title={m.name}>{m.name}</strong>
              <small>
                {m.kind === 'video' ? 'Video' : m.kind === 'image' ? 'Imagen' : 'Audio'}
                {m.kind !== 'image' ? ', ' + fmt(m.duration) : ''}, {formatBytes(m.file.size)}
              </small>
              <div className="ed-media-actions">
                <button type="button" className="ed-btn ed-btn-small" onClick={() => addToTimeline(m)}>Agregar</button>
                <button type="button" className="ed-btn ed-btn-small" onClick={() => removeMedia(m.id)}>Quitar</button>
              </div>
            </div>
          ))}
          <h2>Grabar</h2>
          <div className="ed-media-actions">
            <button type="button" className="ed-btn ed-btn-small" onClick={() => void startRec('camera')} disabled={recMode !== null || exporting}>Camara</button>
            <button type="button" className="ed-btn ed-btn-small" onClick={() => void startRec('screen')} disabled={recMode !== null || exporting}>Pantalla</button>
            <button type="button" className="ed-btn ed-btn-small" onClick={() => void startRec('mic')} disabled={recMode !== null || exporting}>Voz</button>
          </div>
          {recMode && <button type="button" className="ed-btn ed-btn-small ed-rec" onClick={stopRec}>Detener grabacion</button>}
          <h2>Texto</h2>
          <button type="button" className="ed-btn" onClick={addText}>Agregar texto</button>
          <h2>Proximamente</h2>
          {SIDE_FUTURE.map((s) => (
            <button key={s.label} type="button" className="ed-side-item" disabled>
              <span>{s.label}</span>
              <span className="ed-tag">{s.tag}</span>
            </button>
          ))}
        </aside>

        <div className="ed-preview">
          <div className="ed-stage">
            <div className="ed-canvas" style={{ aspectRatio: format.ratioW + ' / ' + format.ratioH, '--ar': format.ratioW / format.ratioH } as React.CSSProperties}>
              <video
                ref={videoRef}
                muted={!project.keepVideoAudio}
                playsInline
                style={{ display: activeMedia?.kind === 'video' ? 'block' : 'none', objectFit: project.fit === 'fill' ? 'cover' : 'contain', ...previewFx }}
              />
              {activeMedia?.kind === 'image' && (
                <img src={activeMedia.url} alt="" style={{ objectFit: project.fit === 'fill' ? 'cover' : 'contain', ...previewFx }} />
              )}
              {!activeMedia && project.vclips.length === 0 && (
                <div className="ed-empty-msg">Importa un video o una imagen y pulsa Agregar.</div>
              )}
              {liveTexts.map((c) => (
                <div
                  key={c.id}
                  className={'ed-text-live' + (sel?.id === c.id ? ' is-sel' : '')} onPointerDown={(e) => startTextDown(e, c.id)}
                  style={{
                    left: c.x + '%',
                    top: c.y + '%',
                    transform: 'translate(-' + c.x + '%, -' + c.y + '%)',
                    fontSize: c.size + 'cqh',
                    color: c.color,
                    background: c.bg ? 'rgba(0,0,0,0.6)' : 'transparent',
                  }}
                >
                  {c.text}
                </div>
              ))}
            </div>
          </div>
          <div className="ed-controls">
            <button type="button" className="ed-btn" onClick={togglePlay} disabled={total <= 0 || exporting}>
              {playing ? 'Pausar' : 'Reproducir'}
            </button>
            <span>{fmt(t)} / {fmt(total)}</span>
            <label>
              <input
                type="checkbox"
                checked={project.keepVideoAudio}
                onChange={(e) => commit((p) => ({ ...p, keepVideoAudio: e.target.checked }))}
              />{' '}
              Conservar audio de los videos
            </label>
          </div>
      <div className="ed-timeline">
        <div className="ed-tl-bar">
          <label>
            Zoom{' '}
            <button type="button" className="ed-btn ed-btn-small ed-zoom" onClick={() => zoomTo(zoom / 1.25)} aria-label="Alejar zoom" title="Alejar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
            </button>
            <input type="range" min={5} max={240} value={Math.round(zoom)} onChange={(e) => zoomTo(Number(e.target.value))} aria-label="Zoom de la linea de tiempo" />
            <button type="button" className="ed-btn ed-btn-small ed-zoom" onClick={() => zoomTo(zoom * 1.25)} aria-label="Acercar zoom" title="Acercar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /><line x1="8" y1="11" x2="14" y2="11" /><line x1="11" y1="8" x2="11" y2="14" /></svg>
            </button>
            <button type="button" className="ed-btn ed-btn-small ed-zoom" onClick={fitZoom} aria-label="Ajustar al contenido" title="Ajustar al contenido">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="4 8 4 4 8 4" /><polyline points="20 8 20 4 16 4" /><polyline points="4 16 4 20 8 20" /><polyline points="20 16 20 20 16 20" /></svg>
            </button>
          </label>
          <button type="button" className="ed-btn ed-btn-small ed-scissors" onClick={splitAtCursor} disabled={exporting} title="Dividir en el cursor" aria-label="Dividir en el cursor">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="8.6" y1="7.6" x2="20" y2="19" /><line x1="8.6" y1="16.4" x2="20" y2="5" /></svg>
            {' '}Dividir
          </button>
          <button type="button" className="ed-btn ed-btn-small" onClick={deleteSel} disabled={!sel || exporting}>Eliminar</button>
          <span>{zoom} px por segundo. Arrastra los clips para moverlos y sus bordes para recortar.</span>
        </div>
        <div
          ref={scrollRef} className="ed-tl-scroll"
          onDragOver={(e) => {
            e.preventDefault()
            const r = e.currentTarget.getBoundingClientRect()
            setDropAt(Math.max(0, (e.clientX - r.left + e.currentTarget.scrollLeft - 90) / zoom))
          }}
          onDragLeave={() => setDropAt(null)}
          onDrop={(e) => {
            e.preventDefault()
            setDropAt(null)
            if (e.dataTransfer.files.length > 0) { void handleFiles(e.dataTransfer.files); return }
            const m = mediaMap.get(e.dataTransfer.getData('text/kompvid-media'))
            if (m) addToTimeline(m, dropAt ?? undefined)
          }}
        >
          <div className="ed-tl-inner" style={{ width: span * zoom + 90 }}>
            <div className="ed-playhead" style={{ left: 90 + t * zoom }}><span className="ed-time-badge">{fmt(t)}</span></div>
            {dropShow !== null && <div className="ed-drop-line" style={{ left: 90 + dropShow * zoom }} />}
            <div className="ed-ruler" style={{ width: span * zoom }} onPointerDown={startScrub} onClick={seekFromRuler}>
              {ticks.map((s) => (
                <span key={s} className="ed-tick" style={{ left: s * zoom }}>{Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}</span>
              ))}
            </div>
            {TRACKS.map((track) => (
              <div key={track.id} className="ed-track" style={{ width: span * zoom }}>
                <span className="ed-track-label">{track.label}</span>
                {track.id === 'overlay' && <span className="ed-track-note">Imagenes superpuestas: pendiente</span>}
                {track.id === 'video' &&
                  project.vclips.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      className={'ed-clip' + (sel?.id === c.id ? ' is-sel' : '')}
                      style={{ left: starts[i] * zoom, width: Math.max(clipDuration(c) * zoom, 6), ...thumbStyle(c.mediaId) }}
                      onPointerDown={(e) => startDrag(e, 'v', c.id)}
                      title={mediaMap.get(c.mediaId)?.name}
                    >
                      {mediaMap.get(c.mediaId)?.name ?? 'Archivo eliminado'}
                    </button>
                  ))}
                {track.id === 'text' &&
                  project.texts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={'ed-clip ed-clip-t' + (sel?.id === c.id ? ' is-sel' : '')}
                      style={{ left: c.start * zoom, width: Math.max(c.duration * zoom, 6) }}
                      onPointerDown={(e) => startDrag(e, 't', c.id)}
                    >
                      {c.text}
                    </button>
                  ))}
                {track.id === 'audio' &&
                  project.aclips.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={'ed-clip ed-clip-a' + (sel?.id === c.id ? ' is-sel' : '')}
                      style={{ left: c.start * zoom, width: Math.max(clipDuration(c) * zoom, 6) }}
                      onPointerDown={(e) => startDrag(e, 'a', c.id)}
                      title={mediaMap.get(c.mediaId)?.name}
                    >
                      {mediaMap.get(c.mediaId)?.name ?? 'Archivo eliminado'}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>

        </div>
      </div>

      {notice && <p className="ed-notice" role="status">{notice}</p>}

      <div className="ed-panel">
        <h2>Clip seleccionado</h2>
        {!sel && <p className="ed-empty">Haz clic en un clip de la linea de tiempo para editarlo.</p>}
        {selV && (
          <div className="ed-fields">
            <NumField label={selVMedia?.kind === 'image' ? 'Duracion (s)' : 'Inicio del recorte (s)'} value={selVMedia?.kind === 'image' ? clipDuration(selV) : selV.inSec} onCommit={(n) => (selVMedia?.kind === 'image' ? patchV(selV.id, { outSec: selV.inSec + n }) : patchV(selV.id, { inSec: n }))} />
            {selVMedia?.kind !== 'image' && <NumField label="Final del recorte (s)" value={selV.outSec} onCommit={(n) => patchV(selV.id, { outSec: n })} />}
            <NumField label="Brillo (-100 a 100)" value={selV.bright ?? 0} step={5} onCommit={(n) => patchFx(selV.id, { bright: Math.min(100, Math.max(-100, n)) })} />
            <NumField label="Contraste (0 a 200)" value={selV.contrast ?? 100} step={5} onCommit={(n) => patchFx(selV.id, { contrast: Math.min(200, Math.max(0, n)) })} />
            <NumField label="Saturacion (0 a 200)" value={selV.sat ?? 100} step={5} onCommit={(n) => patchFx(selV.id, { sat: Math.min(200, Math.max(0, n)) })} />
            <NumField label="Fundido de entrada (s)" value={selV.fadeIn ?? 0} onCommit={(n) => patchFx(selV.id, { fadeIn: Math.max(0, Math.min(n, clipDuration(selV) / 2)) })} />
            <NumField label="Fundido de salida (s)" value={selV.fadeOut ?? 0} onCommit={(n) => patchFx(selV.id, { fadeOut: Math.max(0, Math.min(n, clipDuration(selV) / 2)) })} />
          </div>
        )}
        {selA && (
          <div className="ed-fields">
            <NumField label="Empieza en (s)" value={selA.start} onCommit={(n) => patchA(selA.id, { start: n })} />
            <NumField label="Recorte: inicio (s)" value={selA.inSec} onCommit={(n) => patchA(selA.id, { inSec: n })} />
            <NumField label="Recorte: final (s)" value={selA.outSec} onCommit={(n) => patchA(selA.id, { outSec: n })} />
            <label>
              Volumen: {Math.round(selA.volume * 100)}%
              <input type="range" min={0} max={100} value={Math.round(selA.volume * 100)} onChange={(e) => patchA(selA.id, { volume: Number(e.target.value) / 100 })} />
            </label>
          </div>
        )}
        {selT && (
          <div className="ed-fields">
            <label>
              Texto
              <textarea key={selT.id + selT.text} rows={2} defaultValue={selT.text} onBlur={(e) => { if (e.target.value !== selT.text && e.target.value.trim()) patchT(selT.id, { text: e.target.value }) }} />
            </label>
            <NumField label="Empieza en (s)" value={selT.start} onCommit={(n) => patchT(selT.id, { start: n })} />
            <NumField label="Duracion (s)" value={selT.duration} onCommit={(n) => patchT(selT.id, { duration: n })} />
            <NumField label="Tamano (% del alto)" value={selT.size} step={1} onCommit={(n) => patchT(selT.id, { size: n })} />
            <NumField label="Posicion X (%)" value={selT.x} step={1} onCommit={(n) => patchT(selT.id, { x: n })} />
            <NumField label="Posicion Y (%)" value={selT.y} step={1} onCommit={(n) => patchT(selT.id, { y: n })} />
            <label>
              Color
              <input type="color" value={selT.color} onChange={(e) => patchT(selT.id, { color: e.target.value })} />
            </label>
            <label>
              <span>Fondo</span>
              <input type="checkbox" checked={selT.bg} onChange={(e) => patchT(selT.id, { bg: e.target.checked })} />
            </label>
          </div>
        )}
        {sel && (
          <div className="ed-actions">
            <button type="button" className="ed-btn" onClick={() => moveSel(-1)}>{sel.kind === 'v' ? 'Mover antes' : 'Adelantar 0,5 s'}</button>
            <button type="button" className="ed-btn" onClick={() => moveSel(1)}>{sel.kind === 'v' ? 'Mover despues' : 'Retrasar 0,5 s'}</button>
            <button type="button" className="ed-btn" onClick={splitSel}>Dividir en el cursor</button>
            <button type="button" className="ed-btn" onClick={deleteSel}>Eliminar</button>
          </div>
        )}
      </div>

      <div className="ed-panel ed-export-status">
        {expStage === 'preparing' && <p role="status">Preparando el motor. La primera vez puede tardar unos segundos.</p>}
        {expStage === 'working' && (
          <div role="status">
            <progress value={progress} max={1} aria-label="Progreso de la exportacion" /> {Math.round(progress * 100)}%
          </div>
        )}
        {expError && <p className="ed-error" role="alert">{expError}</p>}
        {result && (
          <div>
            <video
              src={result.url}
              controls
              style={{ maxWidth: '100%', maxHeight: 280, marginTop: 10 }}
              onError={() => setExpError('El archivo exportado no se pudo reproducir en tu navegador. No lo descargues como definitivo.')}
            />
            <p>Peso del archivo: {formatBytes(result.size)}. Si pesa demasiado, descargalo y reducelo con el <Link to="/tools/video-compressor">compresor</Link>.</p>
            <a className="ed-btn ed-btn-primary" href={result.url} download={result.name}>Descargar video</a>
          </div>
        )}
      </div>
    </section>
  )
}