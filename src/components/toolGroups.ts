import { getActiveTools } from '../core/tools/registry'

export type Action = 'compress' | 'convert' | 'edit'

export const ACTIONS: { id: Action; label: string }[] = [
  { id: 'compress', label: 'Comprimir' },
  { id: 'convert', label: 'Convertir' },
  { id: 'edit', label: 'Editar' },
]

const COMPRESS = ['video-compressor', 'video-target-size', 'image-compressor']
const CONVERT = ['video-converter', 'image-converter', 'audio-converter', 'audio-extractor']
const CATEGORY_ORDER = ['video', 'image', 'audio', 'document']

function actionOf(id: string): Action {
  if (COMPRESS.includes(id)) return 'compress'
  if (CONVERT.includes(id)) return 'convert'
  return 'edit'
}

function order(category: string): number {
  const i = CATEGORY_ORDER.indexOf(category)
  return i === -1 ? 99 : i
}

const ITEMS = getActiveTools().map((t) => ({
  id: t.id,
  name: t.name,
  route: t.route,
  category: String(t.category),
  pro: t.requiredPlan === 'pro',
  action: actionOf(t.id),
}))

export const TOOL_MENUS = ACTIONS.map((a) => ({
  ...a,
  items: ITEMS.filter((i) => i.action === a.id).sort((x, y) => order(x.category) - order(y.category)),
})).filter((m) => m.items.length > 0)