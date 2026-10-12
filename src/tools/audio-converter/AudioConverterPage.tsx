import { useState } from 'react'
import AudioToolShell from '../audio-shared/AudioToolShell'
import { codecArgs, type AudioFormat } from '../audio-shared/audioService'

export default function AudioConverterPage() {
  const [format, setFormat] = useState<AudioFormat>('mp3')

  return (
    <AudioToolShell
      toolId="audio-converter"
      title="Convertir audio"
      lead="Cambia el formato de tu audio."
      actionLabel="Convertir audio"
      suffix="convertido"
      kind="audio"
      requiredPlan="free"
      renderOptions={() => (
        <label>
          Convertir a
          <select value={format} onChange={(e) => setFormat(e.target.value as AudioFormat)}>
            <option value="mp3">MP3</option>
            <option value="wav">WAV (sin compresion, pesa mas)</option>
            <option value="m4a">M4A (AAC)</option>
          </select>
        </label>
      )}
      buildJob={() => ({ inputArgs: [], outputArgs: codecArgs(format), format })}
    />
  )
}