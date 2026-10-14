import { Outlet, useLocation } from 'react-router-dom'
import SiteHeader from './SiteHeader'
import NoticeBanner from './NoticeBanner'
import Seo from './Seo'
import SiteFooter from './SiteFooter'
import EditorChrome from './EditorChrome'

export default function Layout() {
  const { pathname } = useLocation()
  const bare = pathname.startsWith('/editor-video')
  return (
    <>
      <Seo />
      {!bare && <NoticeBanner />}
      {!bare && <SiteHeader />}
      <main>
        <Outlet />
      </main>
      {!bare && <SiteFooter />}
      {bare && <EditorChrome />}
    </>
  )
}