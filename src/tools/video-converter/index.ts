import type { ToolDefinition } from '../../core/tools/types'

export const videoConverterTool: ToolDefinition = {
  id: 'video-converter',
  name: 'Convertir video',
  description: 'Cambia el formato de tus videos.',
  category: 'video',
  icon: 'video',
  route: '/tools/video-converter',
  status: 'active',
  requiredPlan: 'free',
  loadComponent: () => import('./VideoConverterPage'),
}