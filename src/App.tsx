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
import NotFoundPage from './pages/NotFoundPage'
import AdminRoute from './admin/AdminRoute'
import AdminLayout from './admin/AdminLayout'
import AdminDashboardPage from './admin/AdminDashboardPage'
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