import type { ToolDefinition } from '../../core/tools/types'

export const audioTrimmerTool: ToolDefinition = {
  id: 'audio-trimmer',
  name: 'Recortar audio',
  description: 'Elige el inicio y el final.',
  category: 'audio',
  icon: 'audio',
  route: '/tools/audio-trimmer',
  status: 'active',
  requiredPlan: 'free',
  loadComponent: () => import('./AudioTrimmerPage'),
}