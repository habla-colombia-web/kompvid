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

export function videoStarts(clips: VClip[]): number[] {
  const out: number[] = []
  let acc = 0
  for (const c of clips) {
    out.push(acc)
    acc += clipDuration(c)
  }
  return out
}

export function totalDuration(p: Project): number {
  return p.vclips.reduce((sum, c) => sum + clipDuration(c), 0)
}

export function canvasSize(format: CanvasFormatId, shortSide: number): { w: number; h: number } {
  const f = CANVAS_FORMATS.find((x) => x.id === format) ?? CANVAS_FORMATS[0]
  const even = (n: number) => Math.round(n / 2) * 2
  if (f.ratioW >= f.ratioH) return { w: even((shortSide * f.ratioW) / f.ratioH), h: shortSide }
  return { w: shortSide, h: even((shortSide * f.ratioH) / f.ratioW) }
}