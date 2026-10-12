import type { ToolDefinition } from './types'
import { videoCompressorTool } from '../../tools/video-compressor'
import { backgroundRemoverTool } from '../../tools/background-remover'

export const tools: ToolDefinition[] = [videoCompressorTool, backgroundRemoverTool]

export const getToolById = (id: string) => tools.find((t) => t.id === id)
export const getActiveTools = () => tools.filter((t) => t.status === 'active')