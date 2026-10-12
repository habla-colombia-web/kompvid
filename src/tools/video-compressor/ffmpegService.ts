import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

// El nucleo debe ser 0.12.x, igual que @ffmpeg/ffmpeg.
const CORE_VERSION = '0.12.10'
const CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@' + CORE_VERSION + '/dist/umd'

const AUTO_MAX_HEIGHT = 720
const AUDIO_BITRATE = 128_000
export const MIN_VIDEO_BITRATE = 150_000

export interface CompressOptions {
  mode: 'auto' | 'custom'
  targetMB?: number
  maxHeight?: number | null
  durationSec: number | null
}

let ffmpeg: FFmpeg | null = null
let loadPromise: Promise<FFmpeg> | null = null

export function loadEngine(): Promise<FFmpeg> {
  if (ffmpeg) return Promise.resolve(ffmpeg)
  if (!loadPromise) {
    loadPromise = (async () => {
      const instance = new FFmpeg()
      instance.on('log', ({ message }) => console.log('[ffmpeg]', message))
      await instance.load({
        coreURL: await toBlobURL(CORE_BASE + '/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL(CORE_BASE + '/ffmpeg-core.wasm', 'application/wasm'),
      })
      ffmpeg = instance
      return instance
    })().catch((err) => {
      loadPromise = null
      throw err
    })
  }
  return loadPromise
}

export function cancelCompression(): void {
  if (!ffmpeg) return
  ffmpeg.terminate()
  ffmpeg = null
  loadPromise = null
}

export function estimateVideoBitrate(targetMB: number, durationSec: number): number {
  const totalBits = targetMB * 1024 * 1024 * 8 * 0.95
  return Math.floor(totalBits / durationSec - AUDIO_BITRATE)
}

function buildArgs(input: string, output: string, o: CompressOptions): string[] {
  const height = o.mode === 'custom' ? o.maxHeight : AUTO_MAX_HEIGHT
  const args = ['-i', input]

  if (height) args.push('-vf', "scale=-2:'min(" + height + ",ih)'")
  args.push('-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p')

  if (o.mode === 'custom' && o.targetMB && o.durationSec) {
    const v = Math.max(MIN_VIDEO_BITRATE, estimateVideoBitrate(o.targetMB, o.durationSec))
    args.push('-b:v', String(v), '-maxrate', String(Math.floor(v * 1.5)), '-bufsize', String(v * 2))
  } else {
    args.push('-crf', '28')
  }

  args.push('-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', output)
  return args
}

async function safeDelete(ff: FFmpeg, name: string): Promise<void> {
  try {
    await ff.deleteFile(name)
  } catch {
    // El archivo ya no existe o el motor fue detenido: no hay nada que limpiar.
  }
}

export async function compressVideo(
  file: File,
  options: CompressOptions,
  onProgress: (progress: number) => void,
): Promise<Blob> {
  const ff = await loadEngine()
  const ext = /\.[a-z0-9]+$/i.exec(file.name)?.[0].toLowerCase() ?? ''
  const inputName = 'input' + ext
  const outputName = 'output.mp4'

  const handler = ({ progress }: { progress: number }) => {
    onProgress(Math.min(1, Math.max(0, progress)))
  }
  ff.on('progress', handler)

  try {
    await ff.writeFile(inputName, await fetchFile(file))
    const code = await ff.exec(buildArgs(inputName, outputName, options))
    if (code !== 0) throw new Error('FFMPEG_EXIT_' + code)
    const data = await ff.readFile(outputName)
    if (typeof data === 'string') throw new Error('FFMPEG_BAD_OUTPUT')
    return new Blob([new Uint8Array(data)], { type: 'video/mp4' })
  } finally {
    ff.off('progress', handler)
    await safeDelete(ff, inputName)
    await safeDelete(ff, outputName)
  }
}