import type { ToolCategory } from './types'

export interface PlannedTool {
  id: string
  name: string
  description: string
  category: ToolCategory
}

// Herramientas planeadas: sin ruta ni funcionalidad. Se mueven al registro cuando esten terminadas.
export const plannedTools: PlannedTool[] = [
]
