import type { ToolDefinition } from '../../core/tools/types'

export const videoEditorTool: ToolDefinition = {
  id: 'video-editor',
  name: 'Editor de video - Kompvid Studio',
  description: 'Une clips, agrega texto y audio, y exporta tu video.',
  category: 'video',
  icon: 'video',
  route: '/editor-video',
  status: 'active',
  requiredPlan: 'free',
  loadComponent: () => import('./VideoEditorPage'),
}