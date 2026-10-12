import type { ToolDefinition } from '../../core/tools/types'

export const audioConverterTool: ToolDefinition = {
  id: 'audio-converter',
  name: 'Convertir audio',
  description: 'Cambia entre MP3, WAV y M4A.',
  category: 'audio',
  icon: 'audio',
  route: '/tools/audio-converter',
  status: 'active',
  requiredPlan: 'free',
  loadComponent: () => import('./AudioConverterPage'),
}