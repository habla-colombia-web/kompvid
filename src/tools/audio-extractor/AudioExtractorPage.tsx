import { useState } from 'react'
import AudioToolShell from '../audio-shared/AudioToolShell'
import { codecArgs, type AudioFormat } from '../audio-shared/audioService'

export default function AudioExtractorPage() {
  const [format, setFormat] = useState<AudioFormat>('mp3')

  return (
    <AudioToolShell
      toolId="audio-extractor"
      title="Extraer audio de video"
      lead="Obten el audio de un video."
      actionLabel="Extraer audio"
      suffix="audio"
      kind="video"
      requiredPlan="free"
      renderOptions={() => (
        <label>
          Formato del audio
          <select value={format} onChange={(e) => setFormat(e.target.value as AudioFormat)}>
            <option value="mp3">MP3</option>
            <option value="wav">WAV (sin compresion, pesa mas)</option>
            <option value="m4a">M4A (AAC)</option>
          </select>
        </label>
      )}
      buildJob={() => ({ inputArgs: [], outputArgs: ['-vn', ...codecArgs(format)], format })}
    />
  )
}