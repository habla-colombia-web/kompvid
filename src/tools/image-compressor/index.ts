import type { ToolDefinition } from '../../core/tools/types'

export const imageCompressorTool: ToolDefinition = {
  id: 'image-compressor',
  name: 'Comprimir imagenes',
  description: 'Reduce el peso de tus imagenes.',
  category: 'image',
  icon: 'image',
  route: '/tools/image-compressor',
  status: 'active',
  requiredPlan: 'free',
  loadComponent: () => import('./ImageCompressorPage'),
}