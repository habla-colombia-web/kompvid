import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import ProtectedRoute from './core/auth/ProtectedRoute'
import { getActiveTools } from './core/tools/registry'
import HomePage from './pages/HomePage'
import HeroShowcase from './components/HeroShowcase'
import PricingPage from './pages/PricingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AccountPage from './pages/AccountPage'
import DashboardPage from './pages/DashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import AdminRoute from './admin/AdminRoute'
import AdminLayout from './admin/AdminLayout'
import AdminDashboardPage from './admin/AdminDashboardPage'
import AdminLimitsPage from './admin/AdminLimitsPage'
import AdminDataPage from './admin/AdminDataPage'
import AdminSupportPage from './admin/AdminSupportPage'
import AdminNoticesPage from './admin/AdminNoticesPage'
import AdminSettingsPage from './admin/AdminSettingsPage'
import SupportPage from './pages/SupportPage'
import AdminPlaceholderPage from './admin/AdminPlaceholderPage'

// Solo las herramientas con estado "active" reciben ruta.
const toolRoutes = getActiveTools().map((tool) => ({
  tool,
  Component: lazy(tool.loadComponent),
}))

export default function App() {
  return (
    <Routes>
      <Route path="admin" element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="herramientas" element={<AdminLimitsPage />} />
          <Route path="usuarios" element={<AdminDataPage kind="usuarios" />} />
          <Route path="soporte" element={<AdminSupportPage />} />
          <Route path="notificaciones" element={<AdminNoticesPage />} />
          <Route path="configuracion" element={<AdminSettingsPage />} />
          <Route path="planes" element={<AdminDataPage kind="planes" />} />
          <Route path="uso" element={<AdminDataPage kind="uso" />} />
          <Route path="auditoria" element={<AdminDataPage kind="auditoria" />} />
          <Route path=":section" element={<AdminPlaceholderPage />} />
        </Route>
      </Route>

      <Route element={<Layout />}>
        <Route index element={<><HeroShowcase /><HomePage /></>} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="account" element={<AccountPage />} />
        <Route path="soporte" element={<SupportPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          {toolRoutes.map(({ tool, Component }) => (
            <Route
              key={tool.id}
              path={tool.route.replace(/^\//, '')}
              element={
                <Suspense fallback={<p className="page-status">Cargando...</p>}>
                  <Component />
                </Suspense>
              }
            />
          ))}
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}