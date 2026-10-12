import type { ToolDefinition } from '../../core/tools/types'

export const imageResizerTool: ToolDefinition = {
  id: 'image-resizer',
  name: 'Cambiar dimensiones',
  description: 'Define ancho y alto en pixeles.',
  category: 'image',
  icon: 'image',
  route: '/tools/image-resizer',
  status: 'active',
  requiredPlan: 'free',
  loadComponent: () => import('./ImageResizerPage'),
}