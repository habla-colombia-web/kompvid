import { extractAudio } from './audioService'
import { TEXT_STYLES, clipDuration, uid, videoStarts } from './types'
import type { AClip, MediaItem, TextClip, VClip } from './types'

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
  let peak = 0
  for (let i = 0; i < audio.length; i++) {
    const v = Math.abs(audio[i])
    if (v > peak) peak = v
  }
  const dur = audio.length / 16000
  const info = 'audio ' + dur.toFixed(1) + ' s, pico ' + peak.toFixed(2)
  if (peak < 0.001) throw new Error('El audio extraido esta en silencio (' + info + ').')
  const asr = await loadAsr(onStatus)
  onStatus('Transcribiendo (' + info + ')...')
  const out = await asr(audio, {
    language: 'spanish',
    task: 'transcribe',
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
  })
  const chunks = (out?.chunks ?? []) as { text: string; timestamp: [number, number | null] }[]
  let segs: Seg[] = chunks
    .map((c) => ({ s: c.timestamp[0], e: c.timestamp[1] ?? c.timestamp[0] + 2, text: c.text.trim() }))
    .filter((x) => x.text)
  if (segs.length === 0 && typeof out?.text === 'string' && out.text.trim()) {
    segs = [{ s: 0, e: dur, text: out.text.trim() }]
  }
  if (segs.length === 0) {
    throw new Error('Whisper no devolvio texto (' + info + '). Respuesta: ' + JSON.stringify(out).slice(0, 200))
  }
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
  aclips: AClip[] = [],
): Promise<TextClip[]> {
  const st = videoStarts(vclips)
  const sd = TEXT_STYLES.find((x) => x.id === 'subtitulo')
  const group = 'cap-' + uid()
  const out: TextClip[] = []
  let seen = 0
  let first = ''

  const addLines = (segs: Seg[], base: number, inSec: number, outSec: number, maxDur: number) => {
    seen += segs.length
    if (!first && segs[0]) {
      first = 'frase ' + segs[0].s.toFixed(1) + '-' + segs[0].e.toFixed(1) + ' s, clip ' + inSec.toFixed(1) + '-' + outSec.toFixed(1) + ' s'
    }
    for (const seg of segs.flatMap(splitLines)) {
      const s = Math.max(seg.s, inSec)
      const e = Math.min(seg.e, outSec)
      if (e - s < 0.2) continue
      out.push({
        id: 'sub-' + uid(),
        captionGroup: group,
        text: seg.text,
        start: base + (s - inSec),
        duration: Math.min(e - s, maxDur),
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

  for (let i = 0; i < vclips.length; i++) {
    const c = vclips[i]
    const m = mediaMap.get(c.mediaId)
    if (!m || m.kind !== 'video') continue
    let segs: Seg[]
    try {
      segs = await transcribe(m, onStatus)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Video mudo: si hay clips de audio (por ejemplo Texto a voz), se usan esos.
      if (aclips.length > 0 && /silencio|no tiene audio|FFMPEG_EXIT/.test(msg)) continue
      throw err
    }
    addLines(segs, st[i], c.inSec, c.outSec, clipDuration(c))
  }

  if (out.length === 0) {
    for (const a of aclips) {
      const m = mediaMap.get(a.mediaId)
      if (!m) continue
      const segs = await transcribe(m, onStatus)
      addLines(segs, a.start, a.inSec, a.outSec, a.outSec - a.inSec)
    }
  }

  if (out.length === 0 && seen > 0) {
    throw new Error('Whisper devolvio ' + seen + ' frases pero ninguna cae dentro del clip (' + first + ').')
  }
  return out
}