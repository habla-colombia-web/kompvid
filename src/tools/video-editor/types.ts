export type CanvasFormatId = 'landscape' | 'vertical' | 'square' | 'portrait'

export interface CanvasFormat {
  id: CanvasFormatId
  label: string
  ratioW: number
  ratioH: number
}

export const CANVAS_FORMATS: CanvasFormat[] = [
  { id: 'landscape', label: 'Horizontal 16:9', ratioW: 16, ratioH: 9 },
  { id: 'vertical', label: 'Vertical 9:16', ratioW: 9, ratioH: 16 },
  { id: 'square', label: 'Cuadrado 1:1', ratioW: 1, ratioH: 1 },
  { id: 'portrait', label: 'Retrato 4:5', ratioW: 4, ratioH: 5 },
]

export interface FormatPreset {
  id: string
  label: string
  format: CanvasFormatId
}

export const FORMAT_PRESETS: FormatPreset[] = [
  { id: 'youtube', label: 'YouTube', format: 'landscape' },
  { id: 'tiktok', label: 'TikTok', format: 'vertical' },
  { id: 'reels', label: 'Instagram Reels', format: 'vertical' },
  { id: 'feed', label: 'Instagram y Facebook Feed', format: 'portrait' },
]

export interface TrackInfo {
  id: string
  label: string
}

export const TRACKS: TrackInfo[] = [
  { id: 'video', label: 'Video' },
  { id: 'overlay', label: 'Imagenes' },
  { id: 'text', label: 'Texto' },
  { id: 'audio', label: 'Audio' },
]

export type MediaKind = 'video' | 'image' | 'audio'

export interface MediaItem {
  id: string
  kind: MediaKind
  file: File
  name: string
  duration: number
  url: string
  width: number
  height: number
}

export interface VClip {
  bright?: number
  contrast?: number
  sat?: number
  fadeIn?: number
  fadeOut?: number
  vol?: number
  trans?: { type: string; dur: number }
  id: string
  mediaId: string
  inSec: number
  outSec: number
}

export interface TextClip {
  id: string
  text: string
  start: number
  duration: number
  size: number
  color: string
  bg: boolean
  boxColor?: string
  radius?: number
  stroke?: number
  strokeColor?: string
  shadowColor?: string
  font?: string
  x: number
  y: number
}

export interface AClip {
  id: string
  mediaId: string
  start: number
  inSec: number
  outSec: number
  volume: number
}

export interface Project {
  format: CanvasFormatId
  fit: 'fit' | 'fill'
  keepVideoAudio: boolean
  vclips: VClip[]
  texts: TextClip[]
  aclips: AClip[]
}

export const EMPTY_PROJECT: Project = {
  format: 'landscape',
  fit: 'fit',
  keepVideoAudio: true,
  vclips: [],
  texts: [],
  aclips: [],
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export const clipDuration = (c: { inSec: number; outSec: number }) => c.outSec - c.inSec

export interface TransDef {
  id: string
  label: string
  xfade: string
  fx: string
  group: 'basic' | 'wipes'
  approx?: boolean
}

export const TRANSITIONS: TransDef[] = [
  { id: 'fade', label: 'Fundido', xfade: 'fade', fx: 'fade', group: 'basic' },
  { id: 'blur', label: 'Fundido desenfocado', xfade: 'hblur', fx: 'fade', group: 'basic', approx: true },
  { id: 'burn', label: 'Quemar', xfade: 'dissolve', fx: 'fade', group: 'basic', approx: true },
  { id: 'black', label: 'Fundido en negro', xfade: 'fadeblack', fx: 'black', group: 'basic' },
  { id: 'white', label: 'Fundido en blanco', xfade: 'fadewhite', fx: 'white', group: 'basic' },
  { id: 'bands', label: 'Bandas horizontales', xfade: 'hlslice', fx: 'bands', group: 'basic' },
  { id: 'tiles', label: 'Mosaicos', xfade: 'pixelize', fx: 'tiles', group: 'basic' },
  { id: 'slide-down', label: 'Barrido fuerte abajo', xfade: 'slidedown', fx: 'down', group: 'wipes' },
  { id: 'slide-up', label: 'Barrido fuerte arriba', xfade: 'slideup', fx: 'up', group: 'wipes' },
  { id: 'wipe-left', label: 'Borrado fuerte izquierda', xfade: 'wipeleft', fx: 'left', group: 'wipes' },
  { id: 'wipe-right', label: 'Borrado fuerte derecha', xfade: 'wiperight', fx: 'right', group: 'wipes' },
  { id: 'smooth-down', label: 'Barrido suave abajo', xfade: 'smoothdown', fx: 'down', group: 'wipes' },
  { id: 'smooth-up', label: 'Barrido suave arriba', xfade: 'smoothup', fx: 'up', group: 'wipes' },
  { id: 'smooth-left', label: 'Barrido suave izquierda', xfade: 'smoothleft', fx: 'left', group: 'wipes' },
  { id: 'smooth-right', label: 'Barrido suave derecha', xfade: 'smoothright', fx: 'right', group: 'wipes' },
  { id: 'diag', label: 'Barrido suave diagonal', xfade: 'diagbr', fx: 'diag', group: 'wipes' },
  { id: 'blinds', label: 'Persianas', xfade: 'vuslice', fx: 'blinds', group: 'wipes' },
  { id: 'circle', label: 'Circulo abierto', xfade: 'circleopen', fx: 'circle', group: 'wipes' },
]

export function transOverlap(clips: VClip[], i: number): number {
  const c = clips[i]
  const n = clips[i + 1]
  if (!c || !n || !c.trans) return 0
  const tp = c.trans.type
  if (!TRANSITIONS.some((x) => x.id === tp)) return 0
  const o = Math.min(c.trans.dur, clipDuration(c) / 2, clipDuration(n) / 2)
  return Math.max(0, Math.round(o * 1000) / 1000)
}

export function videoStarts(clips: VClip[]): number[] {
  const out: number[] = []
  let acc = 0
  for (let i = 0; i < clips.length; i++) {
    out.push(acc)
    acc += clipDuration(clips[i]) - transOverlap(clips, i)
  }
  return out
}

export function totalDuration(p: Project): number {
  return p.vclips.reduce((sum, c, i) => sum + clipDuration(c) - transOverlap(p.vclips, i), 0)
}

export function canvasSize(format: CanvasFormatId, shortSide: number): { w: number; h: number } {
  const f = CANVAS_FORMATS.find((x) => x.id === format) ?? CANVAS_FORMATS[0]
  const even = (n: number) => Math.round(n / 2) * 2
  if (f.ratioW >= f.ratioH) return { w: even((shortSide * f.ratioW) / f.ratioH), h: shortSide }
  return { w: shortSide, h: even((shortSide * f.ratioH) / f.ratioW) }
}
export interface TextStyleDef {
  id: string
  label: string
  group: 'styles' | 'titles'
  text: string
  color: string
  bg: boolean
  boxColor?: string
  radius?: number
  stroke?: number
  strokeColor?: string
  shadowColor?: string
  font?: string
  size?: number
  y?: number
}

export const TEXT_STYLES: TextStyleDef[] = [
  { id: 'creator', label: 'Creator', group: 'styles', text: 'CREATOR', color: '#ffffff', bg: false, stroke: 0.14, strokeColor: '#000000' },
  { id: 'textbox', label: 'Text box', group: 'styles', text: 'Text box', color: '#ffffff', bg: true, boxColor: '#000000' },
  { id: 'pride', label: 'Pride', group: 'styles', text: 'Pride', color: '#ffffff', bg: false, stroke: 0.1, strokeColor: '#6b5bd2', shadowColor: '#ff8a3d' },
  { id: 'button', label: 'Button', group: 'styles', text: 'Button', color: '#111111', bg: true, boxColor: '#ffffff', radius: 0.7 },
  { id: 'bubble', label: 'Bubble', group: 'styles', text: 'Bubble', color: '#b6ff3b', bg: false, stroke: 0.12, strokeColor: '#2f4a0b' },
  { id: 'retro', label: 'Retro', group: 'styles', text: 'RETRO', color: '#1a1a1a', bg: false, shadowColor: '#f26b21', font: 'Impact, sans-serif' },
  { id: 'molon', label: 'Molon', group: 'titles', text: 'MOLON', color: '#ffffff', bg: false, shadowColor: '#ff3b6b' },
  { id: 'fundido', label: 'Fundido', group: 'titles', text: 'Fundido', color: '#ffffff', bg: false, stroke: 0.04, strokeColor: '#000000' },
  { id: 'marea', label: 'Marea', group: 'titles', text: 'MAREA', color: '#ffffff', bg: false, font: 'Georgia, serif' },
  { id: 'funky', label: 'Funky', group: 'titles', text: 'Titulo', color: '#ffffff', bg: true, boxColor: '#5b3fd4', radius: 0.1 },
  { id: 'moderno', label: 'Moderno', group: 'titles', text: 'Titulo', color: '#ffffff', bg: true, boxColor: '#3a2be0' },
  { id: 'subtitulo', label: 'Subtitulo', group: 'titles', text: 'Subtitulo', color: '#ffffff', bg: false, stroke: 0.08, strokeColor: '#000000', size: 5, y: 90 },
]