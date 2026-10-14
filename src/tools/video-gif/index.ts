import type { ToolDefinition } from '../../core/tools/types'

export const videoGifTool: ToolDefinition = {
  id: 'video-gif',
  name: 'Video a GIF',
  description: 'Convierte un video en GIF animado en el formato que elijas.',
  category: 'video',
  icon: 'video',
  route: '/tools/video-gif',
  status: 'active',
  requiredPlan: 'free',
  loadComponent: () => import('./VideoGifPage'),
}