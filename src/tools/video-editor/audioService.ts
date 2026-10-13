import { fetchFile } from '@ffmpeg/util'
import { loadEngine } from '../video-compressor/ffmpegService'
import type { MediaItem } from './types'

export async function extractAudio(m: MediaItem): Promise<File> {
  const ff = await loadEngine()
  const ext = /\.[a-z0-9]+$/i.exec(m.name)?.[0].toLowerCase() ?? ''
  const inName = 'sep_in' + ext
  const outName = 'sep_out.m4a'
  try {
    await ff.writeFile(inName, await fetchFile(m.file))
    const code = await ff.exec(['-i', inName, '-vn', '-c:a', 'aac', '-b:a', '160k', outName])
    if (code !== 0) throw new Error('Este video no tiene audio o no se pudo leer (FFMPEG_EXIT_' + code + ').')
    const data = await ff.readFile(outName)
    if (typeof data === 'string' || data.length === 0) throw new Error('Este video no tiene audio.')
    const base = m.name.replace(/\.[^.]+$/, '')
    return new File([new Uint8Array(data)], base + '-audio.m4a', { type: 'audio/mp4' })
  } finally {
    for (const n of [inName, outName]) {
      try {
        await ff.deleteFile(n)
      } catch {
        // Ya no existe.
      }
    }
  }
}