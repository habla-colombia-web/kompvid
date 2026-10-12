import type { ToolDefinition } from './types'
import { videoCompressorTool } from '../../tools/video-compressor'
import { backgroundRemoverTool } from '../../tools/background-remover'
import { imageCompressorTool } from '../../tools/image-compressor'
import { imageResizerTool } from '../../tools/image-resizer'
import { imageCropperTool } from '../../tools/image-cropper'
import { imageConverterTool } from '../../tools/image-converter'

export const tools: ToolDefinition[] = [
  videoCompressorTool,
  backgroundRemoverTool,
  imageCompressorTool,
  imageResizerTool,
  imageCropperTool,
  imageConverterTool,
]

export const getToolById = (id: string) => tools.find((t) => t.id === id)
export const getActiveTools = () => tools.filter((t) => t.status === 'active')