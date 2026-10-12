import type { ToolDefinition } from '../../core/tools/types'

export const imageConverterTool: ToolDefinition = {
  id: 'image-converter',
  name: 'Convertir imagenes',
  description: 'JPG, PNG, WebP y AVIF cuando tu navegador lo permita.',
  category: 'image',
  icon: 'image',
  route: '/tools/image-converter',
  status: 'active',
  requiredPlan: 'free',
  loadComponent: () => import('./ImageConverterPage'),
}