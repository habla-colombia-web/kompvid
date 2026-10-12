import { fetchFile } from '@ffmpeg/util'
import type { FFmpeg } from '@ffmpeg/ffmpeg'
import { loadEngine } from '../video-compressor/ffmpegService'

export type VideoFormat = 'mp4' | 'mov' | 'webm'

export const FORMAT_MIME: Record<VideoFormat, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
}

function buildArgs(input: string, output: string, format: VideoFormat): string[] {
  if (format === 'webm') {
    return ['-i', input, '-c:v', 'libvpx', '-b:v', '2M', '-crf', '10', '-deadline', 'realtime', '-cpu-used', '5', '-c:a', 'libvorbis', output]
  }
  return [
    '-i', input,
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    output,
  ]
}

async function safeDelete(ff: FFmpeg, name: string): Promise<void> {
  try {
    await ff.deleteFile(name)
  } catch {
    // Ya no existe o el motor fue detenido.
  }
}

export async function convertVideo(
  file: File,
  format: VideoFormat,
  onProgress: (progress: number) => void,
): Promise<Blob> {
  const ff = await loadEngine()
  const ext = /\.[a-z0-9]+$/i.exec(file.name)?.[0].toLowerCase() ?? ''
  const inputName = 'input' + ext
  const outputName = 'output.' + format

  const handler = ({ progress }: { progress: number }) => {
    onProgress(Math.min(1, Math.max(0, progress)))
  }
  ff.on('progress', handler)

  try {
    await ff.writeFile(inputName, await fetchFile(file))
    const code = await ff.exec(buildArgs(inputName, outputName, format))
    if (code !== 0) throw new Error('FFMPEG_EXIT_' + code)
    const data = await ff.readFile(outputName)
    if (typeof data === 'string') throw new Error('FFMPEG_BAD_OUTPUT')
    return new Blob([new Uint8Array(data)], { type: FORMAT_MIME[format] })
  } finally {
    ff.off('progress', handler)
    await safeDelete(ff, inputName)
    await safeDelete(ff, outputName)
  }
}