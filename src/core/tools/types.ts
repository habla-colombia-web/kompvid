import type { ComponentType } from 'react'

export type PlanId = 'free' | 'pro'
export type ToolStatus = 'active' | 'coming-soon'
export type ToolCategory = 'video' | 'image' | 'audio' | 'document'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: ToolCategory
  icon: string
  route: string
  status: ToolStatus
  requiredPlan: PlanId
  loadComponent: () => Promise<{ default: ComponentType }>
}
