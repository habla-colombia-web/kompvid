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