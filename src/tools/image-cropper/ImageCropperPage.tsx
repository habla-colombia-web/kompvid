import { useRef, useState, type PointerEvent } from 'react'
import ImageToolShell from '../image-shared/ImageToolShell'
import { pickOutputType, renderToBlob, type LoadedImage } from '../image-shared/imageUtils'

interface Sel {
  x: number
  y: number
  w: number
  h: number
}

function CropArea({ image, sel, onSel }: { image: LoadedImage; sel: Sel | null; onSel: (s: Sel | null) => void }) {
  const imgRef = useRef<HTMLImageElement>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)

  function point(e: PointerEvent) {
    const rect = imgRef.current!.getBoundingClientRect()
    const scale = image.width / rect.width
    return {
      x: Math.min(Math.max((e.clientX - rect.left) * scale, 0), image.width),
      y: Math.min(Math.max((e.clientY - rect.top) * scale, 0), image.height),
    }
  }

  function down(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    startRef.current = point(e)
    onSel(null)
  }

  function move(e: PointerEvent<HTMLDivElement>) {
    const s = startRef.current
    if (!s) return
    const p = point(e)
    onSel({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) })
  }

  function up() {
    startRef.current = null
  }

  return (
    <div
      style={{ position: 'relative', display: 'inline-block', touchAction: 'none', cursor: 'crosshair', maxWidth: '100%' }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <img
        ref={imgRef}
        src={image.url}
        alt="Imagen para recortar"
        draggable={false}
        style={{ display: 'block', maxWidth: '100%', maxHeight: '60vh', userSelect: 'none' }}
      />
      {sel && (
        <div
          style={{
            position: 'absolute',
            left: (sel.x / image.width) * 100 + '%',
            top: (sel.y / image.height) * 100 + '%',
            width: (sel.w / image.width) * 100 + '%',
            height: (sel.h / image.height) * 100 + '%',
            border: '2px solid #3ddc97',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

export default function ImageCropperPage() {
  const [sel, setSel] = useState<Sel | null>(null)

  return (
    <ImageToolShell
      toolId="image-cropper"
      title="Recortar imagen"
      lead="Arrastra sobre la imagen para elegir el area."
      actionLabel="Recortar imagen"
      requiredPlan="pro"
      suffix="recortada"
      onImageChange={() => setSel(null)}
      validate={() =>
        !sel || Math.round(sel.w) < 1 || Math.round(sel.h) < 1
          ? 'Arrastra sobre la imagen para seleccionar el area a recortar.'
          : null
      }
      renderOptions={(image) => (
        <>
          <CropArea image={image} sel={sel} onSel={setSel} />
          <p className="hint">
            {sel ? 'Area: ' + Math.round(sel.w) + ' x ' + Math.round(sel.h) + ' px' : 'Aun no hay area seleccionada.'}
          </p>
        </>
      )}
      process={async (image) => {
        if (!sel) throw new Error('No hay area seleccionada.')
        const sx = Math.round(sel.x)
        const sy = Math.round(sel.y)
        const sw = Math.max(1, Math.min(Math.round(sel.w), image.width - sx))
        const sh = Math.max(1, Math.min(Math.round(sel.h), image.height - sy))
        const type = await pickOutputType(image.file)
        return renderToBlob({ source: image.bitmap, sx, sy, sw, sh, width: sw, height: sh, type, quality: 0.92 })
      }}
    />
  )
}