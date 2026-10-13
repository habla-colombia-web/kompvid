import { Outlet } from 'react-router-dom'
import SiteHeader from './SiteHeader'
import Seo from './Seo'
import SiteFooter from './SiteFooter'

export default function Layout() {
  return (
    <>
      <Seo />
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}