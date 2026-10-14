import { extractAudio } from './audioService'
import { TEXT_STYLES, clipDuration, uid, videoStarts } from './types'
import type { MediaItem, TextClip, VClip } from './types'

type Seg = { s: number; e: number; text: string }
const cache = new Map<string, Seg[]>()
let asrPromise: Promise<any> | null = null

function loadAsr(onStatus: (m: string) => void): Promise<any> {
  if (!asrPromise) {
    onStatus('Descargando el modelo de voz (solo la primera vez)...')
    asrPromise = import('@huggingface/transformers')
      .then(({ pipeline }) =>
        (pipeline as any)('automatic-speech-recognition', 'onnx-community/whisper-base', {
          dtype: 'q8',
          device: 'wasm',
          progress_callback: (i: any) => {
            if (i?.status === 'progress' && typeof i.progress === 'number') {
              onStatus('Descargando el modelo: ' + Math.round(i.progress) + '%')
            }
          },
        }),
      )
      .catch((e) => {
        asrPromise = null
        throw e
      })
  }
  return asrPromise
}

async function decode16k(file: File): Promise<Float32Array> {
  const ctx = new AudioContext({ sampleRate: 16000 })
  try {
    const buf = await ctx.decodeAudioData(await file.arrayBuffer())
    const n = buf.numberOfChannels
    const out = new Float32Array(buf.length)
    for (let c = 0; c < n; c++) {
      const d = buf.getChannelData(c)
      for (let i = 0; i < out.length; i++) out[i] += d[i] / n
    }
    return out
  } finally {
    void ctx.close()
  }
}

async function transcribe(m: MediaItem, onStatus: (s: string) => void): Promise<Seg[]> {
  const hit = cache.get(m.id)
  if (hit) return hit
  onStatus('Extrayendo el audio de ' + m.name + '...')
  const audio = await decode16k(await extractAudio(m))
  const asr = await loadAsr(onStatus)
  onStatus('Transcribiendo ' + m.name + ' (puede tardar un poco)...')
  const out = await asr(audio, {
    language: 'spanish',
    task: 'transcribe',
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
  })
  const chunks = (out.chunks ?? []) as { text: string; timestamp: [number, number | null] }[]
  const segs = chunks
    .map((c) => ({ s: c.timestamp[0], e: c.timestamp[1] ?? c.timestamp[0] + 2, text: c.text.trim() }))
    .filter((x) => x.text)
  cache.set(m.id, segs)
  return segs
}

function splitLines(seg: Seg): Seg[] {
  const words = seg.text.split(/\s+/).filter(Boolean)
  const size = 7
  if (words.length <= size) return [seg]
  const groups: string[][] = []
  for (let i = 0; i < words.length; i += size) groups.push(words.slice(i, i + size))
  const totalChars = groups.reduce((n, g) => n + g.join(' ').length, 0)
  const span = Math.max(0.2, seg.e - seg.s)
  let at = seg.s
  return groups.map((g) => {
    const len = (g.join(' ').length / totalChars) * span
    const part = { s: at, e: at + len, text: g.join(' ') }
    at += len
    return part
  })
}

export async function buildCaptions(
  vclips: VClip[],
  mediaMap: Map<string, MediaItem>,
  onStatus: (s: string) => void,
): Promise<TextClip[]> {
  const st = videoStarts(vclips)
  const sd = TEXT_STYLES.find((x) => x.id === 'subtitulo')
  const out: TextClip[] = []
  for (let i = 0; i < vclips.length; i++) {
    const c = vclips[i]
    const m = mediaMap.get(c.mediaId)
    if (!m || m.kind !== 'video') continue
    const segs = await transcribe(m, onStatus)
    for (const seg of segs.flatMap(splitLines)) {
      const s = Math.max(seg.s, c.inSec)
      const e = Math.min(seg.e, c.outSec)
      if (e - s < 0.2) continue
      out.push({
        id: 'sub-' + uid(),
        text: seg.text,
        start: st[i] + (s - c.inSec),
        duration: Math.min(e - s, clipDuration(c)),
        size: sd?.size ?? 5,
        color: sd?.color ?? '#ffffff',
        bg: sd?.bg ?? false,
        stroke: sd?.stroke ?? 0.08,
        strokeColor: sd?.strokeColor ?? '#000000',
        x: 50,
        y: sd?.y ?? 90,
      })
    }
  }
  return out
}