export const MAX_CHARS = 800

export const VOICES = [
  { id: 'es_ES-davefx-medium', label: 'Español de España (Dave)' },
  { id: 'es_MX-ald-medium', label: 'Español de México (Ald)' },
]

export async function synthesize(
  text: string,
  voice: string,
  onStatus: (m: string) => void,
): Promise<Blob> {
  const clean = text.replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS)
  if (!clean) throw new Error('Escribe un texto.')
  onStatus('Preparando la voz (la primera vez se descarga el modelo)...')
  const tts = await import('@mintplex-labs/piper-tts-web')
  return tts.predict(
    { text: clean, voiceId: voice as never },
    (p: unknown) => {
      const q = p as { loaded?: number; total?: number }
      if (q.total) onStatus('Descargando la voz: ' + Math.round(((q.loaded ?? 0) / q.total) * 100) + '%')
    },
  )
}