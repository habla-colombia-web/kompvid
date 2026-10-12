import type { ToolDefinition } from '../../core/tools/types'

export const backgroundRemoverTool: ToolDefinition = {
  id: 'background-remover',
  name: 'Quitar fondo de imagen',
  description: 'Quita el fondo de tus imágenes y descárgalas en PNG transparente.',
  category: 'image',
  icon: 'image',
  route: '/tools/background-remover',
  status: 'active',
  requiredPlan: 'pro',
  loadComponent: () => import('./BackgroundRemoverPage'),
}