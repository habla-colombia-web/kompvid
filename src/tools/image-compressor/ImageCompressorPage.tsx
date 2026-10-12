import { useState } from 'react'
import ImageToolShell from '../image-shared/ImageToolShell'
import { pickOutputType, renderToBlob, supportsEncoding, type OutputType } from '../image-shared/imageUtils'

export default function ImageCompressorPage() {
  const [quality, setQuality] = useState(80)
  const [format, setFormat] = useState<'auto' | 'image/jpeg' | 'image/webp'>('auto')

  return (
    <ImageToolShell
      toolId="image-compressor"
      title="Comprimir imagenes"
      lead="Reduce el peso de tus imagenes."
      actionLabel="Comprimir imagen"
      requiredPlan="free"
      suffix="comprimida"
      renderOptions={() => (
        <>
          <label>
            Formato de salida
            <select value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
              <option value="auto">Mantener el formato original</option>
              <option value="image/jpeg">JPG</option>
              <option value="image/webp">WebP</option>
            </select>
          </label>
          <label>
            Calidad: {quality}%
            <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
          </label>
          <p className="hint">PNG no usa calidad: para reducir su peso elige JPG o WebP. JPG no conserva transparencias.</p>
        </>
      )}
      process={async (image) => {
        let type: OutputType = format === 'auto' ? await pickOutputType(image.file) : format
        if (!(await supportsEncoding(type))) type = 'image/jpeg'
        return renderToBlob({
          source: image.bitmap, sx: 0, sy: 0, sw: image.width, sh: image.height,
          width: image.width, height: image.height, type, quality: quality / 100,
        })
      }}
    />
  )
}