import type { ToolCategory } from './types'

export interface PlannedTool {
  id: string
  name: string
  description: string
  category: ToolCategory
}

// Herramientas planeadas: sin ruta ni funcionalidad. Se mueven al registro cuando esten terminadas.
export const plannedTools: PlannedTool[] = [
  { id: 'audio-extractor', name: 'Extraer audio de video', description: 'Obtén el audio de un video.', category: 'audio' },
  { id: 'audio-trimmer', name: 'Recortar audio', description: 'Elige el inicio y el final.', category: 'audio' },
  { id: 'audio-converter', name: 'Convertir audio', description: 'Cambia entre MP3, WAV y otros.', category: 'audio' },
]
