import type { ToolDefinition } from '../../core/tools/types'

export const videoThumbnailTool: ToolDefinition = {
  id: 'video-thumbnail',
  name: 'Miniatura de video',
  description: 'Guarda un fotograma como imagen.',
  category: 'video',
  icon: 'video',
  route: '/tools/video-thumbnail',
  status: 'active',
  requiredPlan: 'free',
  loadComponent: () => import('./VideoThumbnailPage'),
}