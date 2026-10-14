import { Outlet } from 'react-router-dom'
import SiteHeader from './SiteHeader'
import NoticeBanner from './NoticeBanner'
import Seo from './Seo'
import SiteFooter from './SiteFooter'

export default function Layout() {
  return (
    <>
      <Seo />
      <NoticeBanner />
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}