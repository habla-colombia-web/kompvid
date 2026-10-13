import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PRODUCT } from '../config/product'
import { tools } from '../core/tools/registry'

const SITE = 'https://' + PRODUCT.domain
const PRIVATE = ['/admin', '/account', '/login', '/register', '/forgot-password', '/reset-password']

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>('meta[' + attr + '="' + key + '"]')
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function setJsonLd(data: object | null) {
  const id = 'ld-json'
  document.getElementById(id)?.remove()
  if (!data) return
  const s = document.createElement('script')
  s.id = id
  s.type = 'application/ld+json'
  s.text = JSON.stringify(data)
  document.head.appendChild(s)
}

export default function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const path = pathname.replace(/\/+$/, '') || '/'
    const tool = tools.find((t) => t.route.replace(/\/+$/, '') === path)
    const isPrivate = PRIVATE.some((p) => path === p || path.startsWith(p + '/'))

    let title = PRODUCT.name + ': herramientas online para video, imagen y audio'
    let desc = 'Comprime videos, quita el fondo de imágenes, convierte audio y más. Todo se procesa en tu dispositivo, sin subir tus archivos. Empieza gratis.'

    if (path === '/pricing') {
      title = 'Precios y planes | ' + PRODUCT.name
      desc = 'Compara el plan Gratis y Kompvid Pro. Herramientas de video, imagen y audio con procesamiento en tu dispositivo.'
    } else if (tool) {
      title = tool.name + ' online gratis | ' + PRODUCT.name
      desc = tool.description + ' Se procesa en tu navegador, sin subir tus archivos. Pruébalo gratis en ' + PRODUCT.name + '.'
    }

    document.title = title
    setMeta('name', 'description', desc)
    setMeta('name', 'robots', isPrivate ? 'noindex, nofollow' : 'index, follow')
    setCanonical(SITE + (path === '/' ? '/' : path))
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:site_name', PRODUCT.name)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:url', SITE + (path === '/' ? '/' : path))
    setMeta('property', 'og:locale', 'es_CO')
    setMeta('name', 'twitter:card', 'summary')

    if (path === '/') {
      setJsonLd({
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebSite', name: PRODUCT.name, url: SITE + '/', inLanguage: 'es' },
          {
            '@type': 'SoftwareApplication',
            name: PRODUCT.name,
            applicationCategory: 'MultimediaApplication',
            operatingSystem: 'Web',
            url: SITE + '/',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          },
        ],
      })
    } else {
      setJsonLd(null)
    }
  }, [pathname])

  return null
}