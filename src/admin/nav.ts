export type NavItem = { path: string; label: string; icon: string; adminOnly?: boolean; phase?: string }

export const ADMIN_NAV: NavItem[] = [
  { path: '', label: 'Dashboard', icon: 'dashboard' },
  { path: 'usuarios', label: 'Usuarios', icon: 'users', phase: 'Fase 2' },
  { path: 'planes', label: 'Planes y suscripciones', icon: 'plans', phase: 'Fase 3' },
  { path: 'pagos', label: 'Pagos y transacciones', icon: 'payments', adminOnly: true, phase: 'Fase 4' },
  { path: 'herramientas', label: 'Herramientas', icon: 'tools', phase: 'Fase 5' },
  { path: 'uso', label: 'Uso y procesamiento', icon: 'usage', phase: 'Fase 5' },
  { path: 'soporte', label: 'Soporte', icon: 'support', phase: 'Fase 6' },
  { path: 'notificaciones', label: 'Notificaciones', icon: 'bell', adminOnly: true, phase: 'Fase 6' },
  { path: 'auditoria', label: 'Auditoría', icon: 'audit', adminOnly: true, phase: 'Fase 2' },
  { path: 'configuracion', label: 'Configuración', icon: 'settings', adminOnly: true, phase: 'Fase 6' },
]