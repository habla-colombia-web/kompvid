import { Outlet } from 'react-router-dom'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'

export default function Layout() {
  return (
    <>
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}