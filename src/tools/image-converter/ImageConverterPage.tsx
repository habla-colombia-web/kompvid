import { useState } from 'react'
import ImageToolShell from '../image-shared/ImageToolShell'
import { renderToBlob, useEncodingSupport, type OutputType } from '../image-shared/imageUtils'

export default function ImageConverterPage() {
  const support = useEncodingSupport()
  const [target, setTarget] = useState<OutputType>('image/webp')
  const [quality, setQuality] = useState(90)

  return (
    <ImageToolShell
      toolId="image-converter"
      title="Convertir imagenes"
      lead="Cambia el formato de tus imagenes."
      actionLabel="Convertir imagen"
      requiredPlan="free"
      suffix="convertida"
      validate={() => (support[target] ? null : 'Tu navegador no puede generar este formato.')}
      renderOptions={() => (
        <>
          <label>
            Convertir a
            <select value={target} onChange={(e) => setTarget(e.target.value as OutputType)}>
              <option value="image/jpeg">JPG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp" disabled={!support['image/webp']}>WebP</option>
              <option value="image/avif" disabled={!support['image/avif']}>
                AVIF{support['image/avif'] ? '' : ' (no disponible en tu navegador)'}
              </option>
            </select>
          </label>
          {target !== 'image/png' && (
            <label>
              Calidad: {quality}%
              <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
            </label>
          )}
          <p className="hint">JPG no conserva transparencias: se rellenan de blanco.</p>
        </>
      )}
      process={(image) =>
        renderToBlob({
          source: image.bitmap, sx: 0, sy: 0, sw: image.width, sh: image.height,
          width: image.width, height: image.height, type: target, quality: quality / 100,
        })
      }
    />
  )
}