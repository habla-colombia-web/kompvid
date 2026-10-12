import type { ToolCategory } from './types'

export interface PlannedTool {
  id: string
  name: string
  description: string
  category: ToolCategory
}

// Herramientas planeadas: sin ruta ni funcionalidad. Se mueven al registro cuando esten terminadas.
export const plannedTools: PlannedTool[] = [
  { id: 'video-target-size', name: 'Reducir video a un tamaño en MB', description: 'Ajusta el video a un peso objetivo.', category: 'video' },
  { id: 'video-converter', name: 'Convertir video', description: 'Cambia el formato de tus videos.', category: 'video' },
  { id: 'video-thumbnail', name: 'Miniatura de video', description: 'Guarda un fotograma como imagen.', category: 'video' },
  { id: 'image-compressor', name: 'Comprimir imágenes', description: 'Reduce el peso de tus imágenes.', category: 'image' },
  { id: 'image-resizer', name: 'Cambiar dimensiones', description: 'Define ancho y alto en píxeles.', category: 'image' },
  { id: 'image-cropper', name: 'Recortar imagen', description: 'Recorta con una interfaz visual.', category: 'image' },
  { id: 'image-converter', name: 'Convertir imágenes', description: 'JPG, PNG, WebP y AVIF cuando sea posible.', category: 'image' },
  { id: 'audio-extractor', name: 'Extraer audio de video', description: 'Obtén el audio de un video.', category: 'audio' },
  { id: 'audio-trimmer', name: 'Recortar audio', description: 'Elige el inicio y el final.', category: 'audio' },
  { id: 'audio-converter', name: 'Convertir audio', description: 'Cambia entre MP3, WAV y otros.', category: 'audio' },
]