import type { KokoroTTS } from 'kokoro-js'

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX'
export const MAX_CHARS = 800

export const VOICES = [
  { id: 'em_alex', label: 'Español, hombre (Alex)' },
  { id: 'ef_dora', label: 'Español, mujer (Dora)' },
  { id: 'em_santa', label: 'Español, hombre (Santa)' },
]

let enginePromise: Promise<KokoroTTS> | null = null

function loadEngine(onStatus: (m: string) => void): Promise<KokoroTTS> {
  if (!enginePromise) {
    onStatus('Descargando el modelo de voz (solo la primera vez)...')
    enginePromise = import('kokoro-js')
      .then(({ KokoroTTS }) =>
        KokoroTTS.from_pretrained(MODEL_ID, {
          dtype: 'q8',
          device: 'wasm',
          progress_callback: (info: unknown) => {
            const p = info as { status?: string; progress?: number }
            if (p.status === 'progress' && typeof p.progress === 'number') {
              onStatus('Descargando el modelo de voz: ' + Math.round(p.progress) + '%')
            }
          },
        }),
      )
      .catch((err) => {
        enginePromise = null
        throw err
      })
  }
  return enginePromise
}

function splitText(text: string): string[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  const sentences = clean.match(/[^.!?…]+[.!?…]*/g) ?? [clean]
  const parts: string[] = []
  for (let s of sentences.map((x) => x.trim()).filter(Boolean)) {
    while (s.length > 300) {
      let i = s.lastIndexOf(' ', 300)
      if (i < 100) i = 300
      parts.push(s.slice(0, i).trim())
      s = s.slice(i).trim()
    }
    if (s) parts.push(s)
  }
  return parts
}

function toWav(samples: Float32Array, rate: number): Blob {
  const buf = new ArrayBuffer(44 + samples.length * 2)
  const v = new DataView(buf)
  const w = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i))
  }
  w(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  w(36, 'data'); v.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return new Blob([buf], { type: 'audio/wav' })
}

export async function synthesize(text: string, voice: string, onStatus: (m: string) => void): Promise<Blob> {
  const tts = await loadEngine(onStatus)
  const parts = splitText(text.slice(0, MAX_CHARS))
  if (parts.length === 0) throw new Error('Escribe un texto.')
  const chunks: Float32Array[] = []
  let rate = 24000
  for (let i = 0; i < parts.length; i++) {
    onStatus('Generando frase ' + (i + 1) + ' de ' + parts.length + '...')
    await new Promise((r) => setTimeout(r, 0))
    const res = await tts.generate(parts[i], { voice: voice as never })
    const out = res as unknown as { audio: Float32Array; sampling_rate: number }
    rate = out.sampling_rate
    chunks.push(out.audio)
    chunks.push(new Float32Array(Math.round(rate * 0.2)))
  }
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const all = new Float32Array(total)
  let at = 0
  for (const c of chunks) {
    all.set(c, at)
    at += c.length
  }
  return toWav(all, rate)
}