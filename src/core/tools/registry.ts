import type { ToolDefinition } from './types'
import { videoCompressorTool } from '../../tools/video-compressor'
import { backgroundRemoverTool } from '../../tools/background-remover'
import { imageCompressorTool } from '../../tools/image-compressor'
import { imageResizerTool } from '../../tools/image-resizer'
import { imageCropperTool } from '../../tools/image-cropper'
import { imageConverterTool } from '../../tools/image-converter'
import { videoThumbnailTool } from '../../tools/video-thumbnail'
import { videoConverterTool } from '../../tools/video-converter'
import { videoTargetSizeTool } from '../../tools/video-target-size'
import { audioExtractorTool } from '../../tools/audio-extractor'
import { audioTrimmerTool } from '../../tools/audio-trimmer'
import { audioConverterTool } from '../../tools/audio-converter'

export const tools: ToolDefinition[] = [
  videoCompressorTool,
  backgroundRemoverTool,
  imageCompressorTool,
  imageResizerTool,
  imageCropperTool,
  imageConverterTool,
  videoThumbnailTool,
  videoConverterTool,
  videoTargetSizeTool,
  audioExtractorTool,
  audioTrimmerTool,
  audioConverterTool,
]

export const getToolById = (id: string) => tools.find((t) => t.id === id)
export const getActiveTools = () => tools.filter((t) => t.status === 'active')