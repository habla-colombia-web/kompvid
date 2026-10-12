import { useState } from 'react'
import ImageToolShell from '../image-shared/ImageToolShell'
import { MAX_SIDE, pickOutputType, renderToBlob } from '../image-shared/imageUtils'

export default function ImageResizerPage() {
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [keep, setKeep] = useState(true)
  const [ratio, setRatio] = useState(1)

  function onWidth(v: string) {
    setWidth(v)
    const n = Number(v)
    if (keep && Number.isFinite(n) && n > 0) setHeight(String(Math.round(n / ratio)))
  }

  function onHeight(v: string) {
    setHeight(v)
    const n = Number(v)
    if (keep && Number.isFinite(n) && n > 0) setWidth(String(Math.round(n * ratio)))
  }

  return (
    <ImageToolShell
      toolId="image-resizer"
      title="Cambiar dimensiones"
      lead="Define el ancho y el alto en pixeles."
      actionLabel="Cambiar dimensiones"
      requiredPlan="free"
      suffix="redimensionada"
      onImageChange={(img) => {
        setWidth(String(img.width))
        setHeight(String(img.height))
        setRatio(img.width / img.height)
      }}
      validate={() => {
        const w = Number(width)
        const h = Number(height)
        if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1) {
          return 'Indica un ancho y un alto en pixeles, con numeros enteros mayores que cero.'
        }
        if (w > MAX_SIDE || h > MAX_SIDE) return 'El lado maximo permitido es ' + MAX_SIDE + ' px.'
        return null
      }}
      renderOptions={() => (
        <>
          <label>
            Ancho (px)
            <input type="text" inputMode="numeric" value={width} onChange={(e) => onWidth(e.target.value)} />
          </label>
          <label>
            Alto (px)
            <input type="text" inputMode="numeric" value={height} onChange={(e) => onHeight(e.target.value)} />
          </label>
          <label className="radio">
            <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
            <span>Mantener la proporcion</span>
          </label>
        </>
      )}
      process={async (image) => {
        const type = await pickOutputType(image.file)
        return renderToBlob({
          source: image.bitmap, sx: 0, sy: 0, sw: image.width, sh: image.height,
          width: Number(width), height: Number(height), type, quality: 0.92,
        })
      }}
    />
  )
}