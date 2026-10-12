import type { ToolDefinition } from '../../core/tools/types'

export const videoTargetSizeTool: ToolDefinition = {
  id: 'video-target-size',
  name: 'Reducir video a un tamano en MB',
  description: 'Ajusta el video a un peso objetivo.',
  category: 'video',
  icon: 'video',
  route: '/tools/video-target-size',
  status: 'active',
  requiredPlan: 'pro',
  loadComponent: () => import('./VideoTargetSizePage'),
}