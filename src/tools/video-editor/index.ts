import type { ToolDefinition } from '../../core/tools/types'

export const videoEditorTool: ToolDefinition = {
  id: 'video-editor',
  name: 'Editor de video - Kompvid Studio',
  description: 'Edita tus videos desde el navegador. En construccion.',
  category: 'video',
  icon: 'video',
  route: '/editor-video',
  status: 'active',
  requiredPlan: 'free',
  loadComponent: () => import('./VideoEditorPage'),
}