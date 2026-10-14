import { TtsSession } from '@mintplex-labs/piper-tts-web'

export const MAX_CHARS = 800

export const VOICES = [
  { id: 'es_ES-davefx-medium', label: 'Español de España (Dave)' },
  { id: 'es_MX-ald-medium', label: 'Español de México (Ald)' },
  { id: 'es_MX-claude-high', label: 'Español de México (Claude, alta calidad)' },
  { id: 'en_US-amy-medium', label: 'English US (Amy, female)' },
  { id: 'en_US-ryan-medium', label: 'English US (Ryan, male)' },
  { id: 'en_GB-alba-medium', label: 'English UK (Alba, female)' },
]

let session: TtsSession | null = null
let sessionVoice = ''

export async function synthesize(
  text: string,
  voice: string,
  onStatus: (m: string) => void,
): Promise<Blob> {
  const clean = text.replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS)
  if (!clean) throw new Error('Escribe un texto.')
  if (!session || sessionVoice !== voice) {
    onStatus('Preparando la voz (la primera vez se descarga el modelo)...')
    session = await TtsSession.create({
      voiceId: voice as never,
      wasmPaths: {
        ...TtsSession.WASM_LOCATIONS,
        onnxWasm: window.location.origin + '/ort/',
      },
      progress: (p: unknown) => {
        const q = p as { loaded?: number; total?: number }
        if (q.total) onStatus('Descargando la voz: ' + Math.round(((q.loaded ?? 0) / q.total) * 100) + '%')
      },
    })
    sessionVoice = voice
  }
  onStatus('Generando audio...')
  return session.predict(clean)
}