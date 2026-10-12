import type { ToolDefinition } from '../../core/tools/types'

export const audioExtractorTool: ToolDefinition = {
  id: 'audio-extractor',
  name: 'Extraer audio de video',
  description: 'Obten el audio de un video.',
  category: 'audio',
  icon: 'audio',
  route: '/tools/audio-extractor',
  status: 'active',
  requiredPlan: 'free',
  loadComponent: () => import('./AudioExtractorPage'),
}