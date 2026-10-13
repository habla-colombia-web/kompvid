import type { ToolDefinition } from '../../core/tools/types'

export const imageCropperTool: ToolDefinition = {
  id: 'image-cropper',
  name: 'Recortar imagen',
  description: 'Recorta con una interfaz visual.',
  category: 'image',
  icon: 'image',
  route: '/tools/image-cropper',
  status: 'active',
  requiredPlan: 'free',
  loadComponent: () => import('./ImageCropperPage'),
}