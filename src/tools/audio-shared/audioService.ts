import { fetchFile } from '@ffmpeg/util'
import type { FFmpeg } from '@ffmpeg/ffmpeg'
import { loadEngine } from '../video-compressor/ffmpegService'

export type AudioFormat = 'mp3' | 'wav' | 'm4a'

export const AUDIO_MIME: Record<AudioFormat, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
}

export function codecArgs(format: AudioFormat): string[] {
  if (format === 'wav') return ['-c:a', 'pcm_s16le']
  if (format === 'm4a') return ['-c:a', 'aac', '-b:a', '192k']
  return ['-c:a', 'libmp3lame', '-b:a', '192k']
}

export interface AudioJob {
  inputArgs: string[]
  outputArgs: string[]
  format: AudioFormat
}

const AUDIO_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'oga', 'opus', 'flac', 'weba']

export function validateAudioFile(file: File, maxMB: number): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const looksLikeAudio = file.type.startsWith('audio/') || AUDIO_EXTENSIONS.includes(ext)
  if (!looksLikeAudio) return 'Formato no compatible. Usa MP3, WAV, M4A, AAC, OGG o FLAC.'
  if (file.size === 0) return 'El archivo esta vacio.'
  if (file.size > maxMB * 1024 * 1024) {
    return 'El archivo supera el limite de ' + maxMB + ' MB de tu plan.'
  }
  return null
}

export function getMediaDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const el = document.createElement('audio')
    const url = URL.createObjectURL(file)
    let timer = 0
    const done = (value: number | null) => {
      window.clearTimeout(timer)
      el.onloadedmetadata = null
      el.onerror = null
      URL.revokeObjectURL(url)
      resolve(value)
    }
    timer = window.setTimeout(() => done(null), 8000)
    el.preload = 'metadata'
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration : null)
    el.onerror = () => done(null)
    el.src = url
  })
}

async function safeDelete(ff: FFmpeg, name: string): Promise<void> {
  try {
    await ff.deleteFile(name)
  } catch {
    // Ya no existe o el motor fue detenido.
  }
}

export async function runAudioJob(
  file: File,
  job: AudioJob,
  onProgress: (progress: number) => void,
): Promise<Blob> {
  const ff = await loadEngine()
  const ext = /\.[a-z0-9]+$/i.exec(file.name)?.[0].toLowerCase() ?? ''
  const inputName = 'input' + ext
  const outputName = 'output.' + job.format

  const handler = ({ progress }: { progress: number }) => {
    onProgress(Math.min(1, Math.max(0, progress)))
  }
  ff.on('progress', handler)

  try {
    await ff.writeFile(inputName, await fetchFile(file))
    const args = [...job.inputArgs, '-i', inputName, ...job.outputArgs, outputName]
    const code = await ff.exec(args)
    if (code !== 0) throw new Error('FFMPEG_EXIT_' + code)
    const data = await ff.readFile(outputName)
    if (typeof data === 'string') throw new Error('FFMPEG_BAD_OUTPUT')
    return new Blob([new Uint8Array(data)], { type: AUDIO_MIME[job.format] })
  } finally {
    ff.off('progress', handler)
    await safeDelete(ff, inputName)
    await safeDelete(ff, outputName)
  }
}