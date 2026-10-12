import type { ToolDefinition } from '../../core/tools/types'

export const videoCompressorTool: ToolDefinition = {
  id: 'video-compressor',
  name: 'Compresor de video',
  description: 'Reduce el peso de tus videos para compartirlos.',
  category: 'video',
  icon: 'video',
  route: '/tools/video-compressor',
  status: 'coming-soon',
  requiredPlan: 'free',
  loadComponent: () => import('./VideoCompressorPage'),
}
