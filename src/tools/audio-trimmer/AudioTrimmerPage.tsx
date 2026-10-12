import { useState } from 'react'
import AudioToolShell from '../audio-shared/AudioToolShell'
import { codecArgs, type AudioFormat } from '../audio-shared/audioService'
import { formatDuration } from '../video-compressor/utils'

function parseSeconds(v: string): number {
  return Number(v.trim().replace(',', '.'))
}

export default function AudioTrimmerPage() {
  const [start, setStart] = useState('0')
  const [end, setEnd] = useState('')
  const [format, setFormat] = useState<AudioFormat>('mp3')

  return (
    <AudioToolShell
      toolId="audio-trimmer"
      title="Recortar audio"
      lead="Elige el inicio y el final en segundos."
      actionLabel="Recortar audio"
      suffix="recortado"
      kind="audio"
      requiredPlan="free"
      validate={({ duration }) => {
        if (!duration) return 'No se pudo leer la duracion del audio, asi que no se puede recortar.'
        const s = start.trim() === '' ? 0 : parseSeconds(start)
        const e = end.trim() === '' ? duration : parseSeconds(end)
        if (!Number.isFinite(s) || !Number.isFinite(e)) return 'Indica el inicio y el final como numeros, en segundos.'
        if (s < 0) return 'El inicio no puede ser negativo.'
        if (e <= s) return 'El final debe ser mayor que el inicio.'
        if (e > duration + 0.05) return 'El final supera la duracion del audio (' + duration.toFixed(1) + ' s).'
        return null
      }}
      renderOptions={({ duration }) => (
        <>
          <p className="hint">
            Duracion: {duration ? formatDuration(duration) + ' (' + duration.toFixed(1) + ' s)' : 'no disponible'}
          </p>
          <label>
            Inicio (segundos)
            <input type="text" inputMode="decimal" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            Final (segundos, vacio = hasta el final)
            <input type="text" inputMode="decimal" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
          <label>
            Formato de salida
            <select value={format} onChange={(e) => setFormat(e.target.value as AudioFormat)}>
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="m4a">M4A (AAC)</option>
            </select>
          </label>
        </>
      )}
      buildJob={({ duration }) => {
        const s = start.trim() === '' ? 0 : parseSeconds(start)
        const e = end.trim() === '' ? (duration ?? 0) : parseSeconds(end)
        return {
          inputArgs: ['-ss', s.toFixed(2), '-t', (e - s).toFixed(2)],
          outputArgs: codecArgs(format),
          format,
        }
      }}
    />
  )
}